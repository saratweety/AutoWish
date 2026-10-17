package expo.modules.autowishautosend

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

/** Why an automatic send didn't happen, so the notification can say what to do. */
internal enum class FailReason { SERVICE_OFF, LOCKED, NO_WHATSAPP, TIMED_OUT }

/** Tells the person whether their wish went out, using the same channel as the app's reminders. */
internal object AutoSendNotifier {
  private const val CHANNEL_ID = "autowish-reminders" // same as REMINDER_CHANNEL_ID in the app

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Reminders and wishes", NotificationManager.IMPORTANCE_HIGH)
      )
    }
  }

  fun sent(context: Context, job: AutoSendJob) {
    val open = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    post(context, job, "Wish sent to ${job.name}", "AutoWish sent your wish on WhatsApp.", open)
  }

  /** The phone was locked at the send time: it will go out at the next unlock. */
  fun waitingForUnlock(context: Context, job: AutoSendJob) {
    post(
      context,
      job,
      "Your wish to ${job.name} is ready",
      "AutoWish will send it as soon as you unlock your phone. Or tap to send it now.",
      WhatsApp.chatIntent(context, job.phone, job.text)
    )
  }

  fun failed(context: Context, job: AutoSendJob, reason: FailReason) {
    val why = when (reason) {
      FailReason.LOCKED -> "Your phone was locked, so it couldn't be sent automatically."
      FailReason.SERVICE_OFF -> "Auto-send is switched off in Accessibility settings."
      FailReason.NO_WHATSAPP -> "WhatsApp couldn't be opened."
      FailReason.TIMED_OUT -> "WhatsApp took too long to open."
    }
    // Tapping opens WhatsApp with the wish ready, so it can still be sent by hand.
    post(context, job, "Tap to send your wish to ${job.name}", "$why Tap to open WhatsApp with your wish ready.",
      WhatsApp.chatIntent(context, job.phone, job.text))
  }

  private fun post(context: Context, job: AutoSendJob, title: String, body: String, tapIntent: Intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return
    ensureChannel(context)
    tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    val onTap = PendingIntent.getActivity(
      context,
      job.wishId.hashCode(),
      tapIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }
    val notification = builder
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(Notification.BigTextStyle().bigText(body))
      .setContentIntent(onTap)
      .setAutoCancel(true)
      .build()
    context.getSystemService(NotificationManager::class.java)?.notify(job.wishId.hashCode(), notification)
  }
}
