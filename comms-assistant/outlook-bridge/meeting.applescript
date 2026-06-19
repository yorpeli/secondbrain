-- Calendar meeting-invite creator for the comms assistant.
-- Creates a REVIEWABLE, UNSENT meeting invite in Outlook for Mac and opens it.
-- NEVER calls `send meeting` — Yonatan reviews, adds the join link, and sends.
--
-- Hard-won field-binding rules for Outlook-for-Mac's calendar compose window
-- (verified live 2026-06-19; this is a buggy/racy UI):
--   * Attendees bind only when added BEFORE `open` (and survive the after-open writes
--     below ONLY if `content` is NOT set before open — a before-open body makes the
--     after-open start/end write wipe both body and attendees).
--   * subject / start time / end time bind only when set AFTER `open`.
--   * body (`content`/`plain text content`) is IGNORED when set after open, and a
--     before-open body is wiped by the after-open start/end write. So the body cannot
--     be auto-filled alongside a correct time — it's placed on the clipboard instead
--     for a single paste into the notes field.
--
-- argv: "meeting" <subject> <bodyForClipboard> <attendeesSpec>
--        <sy> <smo> <sd> <sh> <smi> <ey> <emo> <ed> <eh> <emi>
--   attendeesSpec = "Name||email;;Name||email" (";;" between attendees, "||" name|email)

on makeDate(y, mo, d, h, mi)
	set theDate to current date
	set day of theDate to 1
	set year of theDate to (y as integer)
	set month of theDate to (mo as integer)
	set day of theDate to (d as integer)
	set hours of theDate to (h as integer)
	set minutes of theDate to (mi as integer)
	set seconds of theDate to 0
	return theDate
end makeDate

on realCalendar()
	tell application "Microsoft Outlook"
		set theCal to missing value
		set maxEvt to -1
		repeat with c in calendars
			set ec to (count of calendar events of c)
			if ec > maxEvt then
				set maxEvt to ec
				set theCal to c
			end if
		end repeat
		if theCal is missing value then error "NO_CALENDAR: no addressable calendar" number 2
		return theCal
	end tell
end realCalendar

on run argv
	if item 1 of argv is not "meeting" then error "BAD_MODE: " & (item 1 of argv) number 3
	set theSubject to item 2 of argv
	set theBody to item 3 of argv
	set attSpec to item 4 of argv
	set startDate to my makeDate(item 5 of argv, item 6 of argv, item 7 of argv, item 8 of argv, item 9 of argv)
	set endDate to my makeDate(item 10 of argv, item 11 of argv, item 12 of argv, item 13 of argv, item 14 of argv)
	set theCal to my realCalendar()

	-- Split the attendee spec up front (materialize the list before reusing delimiters).
	set AppleScript's text item delimiters to ";;"
	set attList to text items of attSpec
	set AppleScript's text item delimiters to "||"

	tell application "Microsoft Outlook"
		set ev to make new calendar event at theCal
		-- Attendees BEFORE open (no body set before open, so they survive).
		repeat with a in attList
			set pair to (a as string)
			if pair is not "" then
				set nm to text item 1 of pair
				set em to ""
				if (count of text items of pair) ≥ 2 then set em to text item 2 of pair
				if em is not "" then
					make new required attendee at ev with properties {email address:{name:nm, address:em}}
				end if
			end if
		end repeat
		set AppleScript's text item delimiters to ""

		open ev
		activate
		delay 0.9
		-- subject / start / end bind only AFTER open.
		set subject of ev to theSubject
		set start time of ev to startDate
		set end time of ev to endDate
	end tell

	-- Body can't be auto-filled with a correct time (Outlook bug) — stage it on the
	-- clipboard so Yonatan pastes it into the notes field with a single Cmd+V.
	if theBody is not "" then set the clipboard to theBody
	return "OK"
end run
