-- Several reminders per person (a week before, the day before, on the day...).
-- The single value each row already holds becomes a one-item list, so nothing
-- saved so far is lost: remindDaysBefore 1 becomes {1}.

ALTER TABLE "SpecialDay"
  ALTER COLUMN "remindDaysBefore" TYPE INTEGER[]
  USING ARRAY["remindDaysBefore"];

ALTER TABLE "Settings"
  ALTER COLUMN "defaultRemindDaysBefore" TYPE INTEGER[]
  USING ARRAY["defaultRemindDaysBefore"];
