package expo.modules.autowishautosend

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Runs at a wish's send time (and after the phone restarts). */
class AutoSendReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      AutoSendScheduler.ACTION_SEND -> {
        val wishId = intent.getStringExtra(AutoSendScheduler.EXTRA_WISH_ID) ?: return
        val job = AutoSendStore.getJob(context, wishId) ?: return
        AutoSendStore.removeJob(context, wishId)
        sendNow(context, job)
      }
      Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> AutoSendScheduler.restoreAll(context)
    }
  }

  private fun sendNow(context: Context, job: AutoSendJob) {
    val service = AutoSendAccessibilityService.instance
    if (service == null) {
      AutoSendNotifier.failed(context, job, FailReason.SERVICE_OFF)
      return
    }
    // Android doesn't let any app tap buttons behind the lock screen, so the wish
    // waits and goes out as soon as the person unlocks their phone.
    val keyguard = context.getSystemService(KeyguardManager::class.java)
    if (keyguard?.isKeyguardLocked == true) {
      AutoSendStore.addWaiting(context, job)
      AutoSendNotifier.waitingForUnlock(context, job)
      return
    }
    if (!service.start(job)) AutoSendNotifier.failed(context, job, FailReason.NO_WHATSAPP)
  }
}
