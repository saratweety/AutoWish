package expo.modules.autowishautosend

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** What the app (JavaScript) can ask the Android side to do. */
class AutoSendModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private fun openSettingsPage(intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      // Some phones don't have that exact page: fall back to this app's info page.
      context.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }
  }

  private fun isServiceEnabled(): Boolean {
    val ours = ComponentName(context, AutoSendAccessibilityService::class.java)
    val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
      ?: return false
    return enabled.split(':').any { ComponentName.unflattenFromString(it) == ours }
  }

  override fun definition() = ModuleDefinition {
    Name("AutoWishAutoSend")

    Function("isServiceEnabled") { isServiceEnabled() }

    Function("openAccessibilitySettings") {
      // Android never lets an app switch its own accessibility service on, so we open the list
      // for the user. These extras ask Settings to scroll to AutoWish and highlight it. Pixel,
      // Samsung and many other phones support them; phones that don't just open the plain list.
      val key = ComponentName(context, AutoSendAccessibilityService::class.java).flattenToString()
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        .putExtra(":settings:fragment_args_key", key)
        .putExtra(":settings:show_fragment_args", Bundle().apply { putString(":settings:fragment_args_key", key) })
      openSettingsPage(intent)
    }

    Function("openAppInfo") {
      openSettingsPage(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
    }

    Function("canScheduleExactAlarms") { AutoSendScheduler.canScheduleExact(context) }

    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        openSettingsPage(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}")))
      }
    }

    Function("isIgnoringBatteryOptimizations") {
      context.getSystemService(PowerManager::class.java)?.isIgnoringBatteryOptimizations(context.packageName) ?: false
    }

    // Opens the battery optimisation list so the person can choose "Don't optimise" for AutoWish.
    Function("openBatterySettings") {
      openSettingsPage(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
    }

    Function("isWhatsAppInstalled") { WhatsApp.installedPackage(context) != null }

    Function("schedule") { wishId: String, phone: String, text: String, name: String, atMillis: Double ->
      AutoSendScheduler.schedule(context, AutoSendJob(wishId, phone, text, name, atMillis.toLong()))
    }

    Function("cancel") { wishId: String ->
      AutoSendScheduler.cancel(context, wishId)
    }

    Function("cancelAll") {
      AutoSendScheduler.cancelAll(context)
    }

    Function("consumeSentWishIds") { AutoSendStore.consumeSent(context) }
  }
}
