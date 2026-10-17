package expo.modules.autowishautosend

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build

/** Finding WhatsApp and opening a chat with a message already typed. */
internal object WhatsApp {
  private val PACKAGES = listOf("com.whatsapp", "com.whatsapp.w4b") // WhatsApp, then WhatsApp Business

  fun installedPackage(context: Context): String? = PACKAGES.firstOrNull { isInstalled(context, it) }

  private fun isInstalled(context: Context, packageName: String): Boolean =
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION")
        context.packageManager.getPackageInfo(packageName, 0)
      }
      true
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }

  /** Opens the chat with this number with the text in the message box. */
  fun chatIntent(context: Context, phone: String, text: String): Intent {
    val uri = Uri.parse("https://api.whatsapp.com/send?phone=$phone&text=${Uri.encode(text)}")
    return Intent(Intent.ACTION_VIEW, uri).apply {
      installedPackage(context)?.let { setPackage(it) }
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
  }
}
