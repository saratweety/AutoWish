package expo.modules.autowishautosend

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/** Sets and cancels the alarms that fire at each wish's send time. */
internal object AutoSendScheduler {
  const val ACTION_SEND = "expo.modules.autowishautosend.SEND"
  const val EXTRA_WISH_ID = "wishId"

  private fun alarmIntent(context: Context, wishId: String): PendingIntent {
    val intent = Intent(context, AutoSendReceiver::class.java)
      .setAction(ACTION_SEND)
      .putExtra(EXTRA_WISH_ID, wishId)
    return PendingIntent.getBroadcast(
      context,
      wishId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  fun canScheduleExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return context.getSystemService(AlarmManager::class.java)?.canScheduleExactAlarms() ?: false
  }

  private fun setAlarm(context: Context, job: AutoSendJob) {
    val alarms = context.getSystemService(AlarmManager::class.java) ?: return
    val pending = alarmIntent(context, job.wishId)
    // Exact time if the person allowed "Alarms & reminders"; otherwise Android may
    // deliver it a few minutes late to save battery.
    try {
      if (canScheduleExact(context)) {
        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, job.atMillis, pending)
      } else {
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, job.atMillis, pending)
      }
    } catch (e: SecurityException) {
      alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, job.atMillis, pending)
    }
  }

  fun schedule(context: Context, job: AutoSendJob) {
    if (job.atMillis <= System.currentTimeMillis()) return
    AutoSendStore.saveJob(context, job)
    setAlarm(context, job)
  }

  fun cancel(context: Context, wishId: String) {
    context.getSystemService(AlarmManager::class.java)?.cancel(alarmIntent(context, wishId))
    AutoSendStore.removeJob(context, wishId)
    AutoSendStore.removeWaiting(context, wishId) // e.g. sent by hand while waiting for unlock
  }

  fun cancelAll(context: Context) {
    for (job in AutoSendStore.allJobs(context)) {
      context.getSystemService(AlarmManager::class.java)?.cancel(alarmIntent(context, job.wishId))
    }
    AutoSendStore.clearJobs(context)
    AutoSendStore.clearWaiting(context)
  }

  /** After a restart Android forgets all alarms, so set them again. Past ones are dropped. */
  fun restoreAll(context: Context) {
    val now = System.currentTimeMillis()
    for (job in AutoSendStore.allJobs(context)) {
      if (job.atMillis > now) setAlarm(context, job) else AutoSendStore.removeJob(context, job.wishId)
    }
  }
}
