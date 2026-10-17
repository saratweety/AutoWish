package expo.modules.autowishautosend

import android.accessibilityservice.AccessibilityService
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Sends a scheduled wish: opens the WhatsApp chat with the message typed, waits for
 * it to appear, checks the message box holds exactly that wish, then taps Send.
 *
 * It does nothing unless a wish is being sent right now, it only receives events
 * from WhatsApp (see autowish_autosend_service.xml), and it never stores or shares
 * anything it sees.
 */
class AutoSendAccessibilityService : AccessibilityService() {
  companion object {
    /** Set while the person has the service switched on. */
    @Volatile
    var instance: AutoSendAccessibilityService? = null
      private set

    private const val TIMEOUT_MS = 30_000L
    private const val LEAVE_DELAY_MS = 1_500L
    private const val UNLOCK_DELAY_MS = 1_500L
    private const val NEXT_DELAY_MS = 3_000L
  }

  private val handler = Handler(Looper.getMainLooper())
  private var current: AutoSendJob? = null
  private var currentPackage: String? = null
  /** Wishes to send one after another (e.g. several were due while the phone was locked). */
  private val queue = ArrayDeque<AutoSendJob>()

  private val timeout = Runnable {
    current?.let { finish(it, sent = false) }
  }

  /** When the person unlocks their phone, send the wishes that were due while it was locked. */
  private val unlockReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == Intent.ACTION_USER_PRESENT) sendWaiting()
    }
  }
  private var listeningForUnlock = false

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
    val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(unlockReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(unlockReceiver, filter)
    }
    listeningForUnlock = true
    // Already unlocked (e.g. the service just restarted): send anything still waiting.
    if (getSystemService(KeyguardManager::class.java)?.isKeyguardLocked != true) sendWaiting()
  }

  override fun onUnbind(intent: Intent?): Boolean {
    stopListening()
    instance = null
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    stopListening()
    instance = null
    handler.removeCallbacksAndMessages(null)
    super.onDestroy()
  }

  private fun stopListening() {
    if (!listeningForUnlock) return
    listeningForUnlock = false
    try {
      unregisterReceiver(unlockReceiver)
    } catch (e: Exception) {
      // Already unregistered.
    }
  }

  override fun onInterrupt() {}

  private fun sendWaiting() {
    val waiting = AutoSendStore.takeWaiting(this)
    if (waiting.isEmpty()) return
    queue.addAll(waiting)
    // Give the home screen a moment to settle after unlocking.
    handler.postDelayed({ startNext() }, UNLOCK_DELAY_MS)
  }

  private fun startNext() {
    if (current != null) return
    val job = queue.removeFirstOrNull() ?: return
    if (!start(job)) {
      AutoSendNotifier.failed(this, job, FailReason.NO_WHATSAPP)
      startNext()
    }
  }

  /** Opens WhatsApp for this wish (or queues it if another is being sent). False if WhatsApp isn't there. */
  internal fun start(job: AutoSendJob): Boolean {
    if (current != null) {
      queue.addLast(job)
      return true
    }
    val packageName = WhatsApp.installedPackage(this) ?: return false
    current = job
    currentPackage = packageName
    handler.removeCallbacks(timeout)
    handler.postDelayed(timeout, TIMEOUT_MS)
    return try {
      startActivity(WhatsApp.chatIntent(this, job.phone, job.text))
      true
    } catch (e: Exception) {
      current = null
      handler.removeCallbacks(timeout)
      false
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val job = current ?: return
    val packageName = currentPackage ?: return
    if (event?.packageName?.toString() != packageName) return
    val root = rootInActiveWindow ?: return

    // Safety check: only tap Send when the message box holds this exact wish.
    val box = root.findAccessibilityNodeInfosByViewId("$packageName:id/entry").firstOrNull() ?: return
    if (normalise(box.text?.toString()) != normalise(job.text)) return

    val send = root.findAccessibilityNodeInfosByViewId("$packageName:id/send")
      .firstOrNull { it.isEnabled && it.isVisibleToUser } ?: return

    current = null // never tap twice
    val tapped = send.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    finish(job, sent = tapped)
    // Leave WhatsApp and go back to the home screen once the message is on its way.
    if (tapped) handler.postDelayed({ performGlobalAction(GLOBAL_ACTION_HOME) }, LEAVE_DELAY_MS)
  }

  private fun finish(job: AutoSendJob, sent: Boolean) {
    handler.removeCallbacks(timeout)
    current = null
    currentPackage = null
    if (sent) {
      AutoSendStore.addSent(this, job.wishId)
      AutoSendNotifier.sent(this, job)
    } else {
      AutoSendNotifier.failed(this, job, FailReason.TIMED_OUT)
    }
    // Next waiting wish, after WhatsApp has been left.
    if (queue.isNotEmpty()) handler.postDelayed({ startNext() }, NEXT_DELAY_MS)
  }

  /** Spaces and line breaks can differ slightly once WhatsApp shows the text. */
  private fun normalise(text: String?) = text.orEmpty().replace(Regex("\\s+"), " ").trim()
}
