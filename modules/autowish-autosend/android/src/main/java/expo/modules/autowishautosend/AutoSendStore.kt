package expo.modules.autowishautosend

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** One wish waiting to be sent automatically. */
internal data class AutoSendJob(
  val wishId: String,
  val phone: String,
  val text: String,
  val name: String,
  val atMillis: Long
) {
  fun toJson(): JSONObject = JSONObject()
    .put("wishId", wishId)
    .put("phone", phone)
    .put("text", text)
    .put("name", name)
    .put("atMillis", atMillis)

  companion object {
    fun fromJson(json: JSONObject) = AutoSendJob(
      wishId = json.getString("wishId"),
      phone = json.getString("phone"),
      text = json.getString("text"),
      name = json.optString("name", ""),
      atMillis = json.getLong("atMillis")
    )
  }
}

/**
 * Saves scheduled jobs and the ids of wishes that were sent, on the phone only.
 * Native code needs its own copy because it runs when the app itself is closed.
 */
internal object AutoSendStore {
  private const val PREFS = "autowish_autosend"
  private const val KEY_JOBS = "jobs"
  private const val KEY_SENT = "sent"
  private const val KEY_WAITING = "waiting" // due while the phone was locked; sent at the next unlock

  /** A wish that was due while locked is still sent if the phone is unlocked within this time. */
  private const val WAIT_LIMIT_MS = 24L * 60 * 60 * 1000

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun readMap(context: Context, key: String): JSONObject =
    try {
      JSONObject(prefs(context).getString(key, null) ?: "{}")
    } catch (e: Exception) {
      JSONObject()
    }

  private fun writeMap(context: Context, key: String, map: JSONObject) {
    // commit() (not apply()) so it's saved even if Android stops us right after.
    prefs(context).edit().putString(key, map.toString()).commit()
  }

  private fun readJobs(context: Context) = readMap(context, KEY_JOBS)

  private fun writeJobs(context: Context, jobs: JSONObject) = writeMap(context, KEY_JOBS, jobs)

  // --- Wishes waiting for the phone to be unlocked ---

  @Synchronized
  fun addWaiting(context: Context, job: AutoSendJob) {
    val waiting = readMap(context, KEY_WAITING)
    waiting.put(job.wishId, job.toJson())
    writeMap(context, KEY_WAITING, waiting)
  }

  /** Returns every waiting wish that is still recent enough to send, and clears the list. */
  @Synchronized
  fun takeWaiting(context: Context): List<AutoSendJob> {
    val waiting = readMap(context, KEY_WAITING)
    writeMap(context, KEY_WAITING, JSONObject())
    val now = System.currentTimeMillis()
    return waiting.keys().asSequence().mapNotNull { key ->
      try {
        AutoSendJob.fromJson(waiting.getJSONObject(key))
      } catch (e: Exception) {
        null
      }
    }.filter { now - it.atMillis < WAIT_LIMIT_MS }.sortedBy { it.atMillis }.toList()
  }

  @Synchronized
  fun removeWaiting(context: Context, wishId: String) {
    val waiting = readMap(context, KEY_WAITING)
    waiting.remove(wishId)
    writeMap(context, KEY_WAITING, waiting)
  }

  fun clearWaiting(context: Context) = writeMap(context, KEY_WAITING, JSONObject())

  fun saveJob(context: Context, job: AutoSendJob) {
    val jobs = readJobs(context)
    jobs.put(job.wishId, job.toJson())
    writeJobs(context, jobs)
  }

  fun getJob(context: Context, wishId: String): AutoSendJob? =
    readJobs(context).optJSONObject(wishId)?.let { AutoSendJob.fromJson(it) }

  fun removeJob(context: Context, wishId: String) {
    val jobs = readJobs(context)
    jobs.remove(wishId)
    writeJobs(context, jobs)
  }

  fun allJobs(context: Context): List<AutoSendJob> {
    val jobs = readJobs(context)
    return jobs.keys().asSequence().mapNotNull { key ->
      try {
        AutoSendJob.fromJson(jobs.getJSONObject(key))
      } catch (e: Exception) {
        null
      }
    }.toList()
  }

  fun clearJobs(context: Context) = writeJobs(context, JSONObject())

  @Synchronized
  fun addSent(context: Context, wishId: String) {
    val sent = readSent(context)
    sent.put(wishId)
    prefs(context).edit().putString(KEY_SENT, sent.toString()).commit()
  }

  /** Returns the ids of wishes sent since the last call, and forgets them. */
  @Synchronized
  fun consumeSent(context: Context): List<String> {
    val sent = readSent(context)
    prefs(context).edit().remove(KEY_SENT).commit()
    return (0 until sent.length()).map { sent.getString(it) }
  }

  private fun readSent(context: Context): JSONArray =
    try {
      JSONArray(prefs(context).getString(KEY_SENT, null) ?: "[]")
    } catch (e: Exception) {
      JSONArray()
    }
}
