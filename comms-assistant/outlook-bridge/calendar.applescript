-- Calendar bridge for the comms assistant — READ-ONLY.
-- Mode:
--   busy <sy> <smo> <sd> <ey> <emo> <ed>   — read events in a day window → "start|end" lines
--
-- Meeting CREATION is NOT done here: AppleScript cannot create a persistent, reviewable
-- *unsent* invite on Legacy Outlook (an unsent invitation is an ephemeral draft that only
-- persists if sent, and the compose window won't render scripted subject/location/time —
-- verified live 2026-06-19). The create path is an .ics file opened in Outlook instead
-- (see comms-assistant/schedule/ics.ts).

-- Build a local AppleScript date from numeric components, guarding month/day overflow.
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

-- Pick the real calendar: the one with the most events. `default calendar` errors (-1728)
-- and `calendar 1` is an empty placeholder, so neither is usable.
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

-- Format an AppleScript date as naive local "YYYY-MM-DDTHH:MM".
on fmtNaive(d)
	set y to (year of d) as integer
	set mo to (month of d as integer)
	set dy to (day of d) as integer
	set hh to (hours of d) as integer
	set mm to (minutes of d) as integer
	set p2 to "0"
	set moS to text -2 thru -1 of (p2 & mo)
	set dyS to text -2 thru -1 of (p2 & dy)
	set hhS to text -2 thru -1 of (p2 & hh)
	set mmS to text -2 thru -1 of (p2 & mm)
	return (y as string) & "-" & moS & "-" & dyS & "T" & hhS & ":" & mmS
end fmtNaive

on run argv
	set theMode to item 1 of argv
	tell application "Microsoft Outlook"
		if theMode is "busy" then
			set winStart to my makeDate(item 2 of argv, item 3 of argv, item 4 of argv, 0, 0)
			set winEnd to my makeDate(item 5 of argv, item 6 of argv, item 7 of argv, 23, 59)
			set theCal to my realCalendar()
			set out to ""
			repeat with e in (calendar events of theCal whose start time is greater than or equal to winStart and start time is less than or equal to winEnd)
				try
					if (all day flag of e) is false then
						set out to out & my fmtNaive(start time of e) & "|" & my fmtNaive(end time of e) & linefeed
					end if
				end try
			end repeat
			return out
		else
			error "BAD_MODE: " & theMode number 3
		end if
	end tell
end run
