on pad(n)
	if n < 10 then return "0" & (n as string)
	return n as string
end pad

on isoDate(d)
	return (year of d as string) & "-" & my pad((month of d) as integer) & "-" & my pad(day of d) & ¬
		"T" & my pad(hours of d) & ":" & my pad(minutes of d) & ":" & my pad(seconds of d)
end isoDate

on senderAddr(m)
	-- Outlook access must be inside a tell block: `my`-called handlers run in the SCRIPT
	-- context, not the app's. `sender` is itself the email-address record {name, address};
	-- bind it to a variable before accessing `address` (inline form fails coercion).
	tell application "Microsoft Outlook"
		try
			set s to sender of m
			return address of s
		on error
			try
				set s to sender of m
				return name of s
			on error
				return "(unknown)"
			end try
		end try
	end tell
end senderAddr

on trimSpace(s)
	set s to s as string
	repeat while s starts with " "
		set s to text 2 thru -1 of s
	end repeat
	repeat while (s is not "") and (s ends with " ")
		set s to text 1 thru -2 of s
	end repeat
	return s
end trimSpace

on headerValue(m, fieldName)
	set out to ""
	tell application "Microsoft Outlook"
		try
			set hdrs to (headers of m) as string
			set paras to paragraphs of hdrs
			repeat with i from 1 to (count of paras)
				set s to (item i of paras) as string
				if s starts with fieldName then
					-- guard: when the line IS just the field name (e.g. "Message-ID:"), the
					-- substring `text (len+1) thru -1` is out of range and throws — only take
					-- the remainder when the line is longer than the field name.
					if (length of s) > (length of fieldName) then
						set v to my trimSpace(text ((length of fieldName) + 1) thru -1 of s)
					else
						set v to ""
					end if
					-- value folded onto the next line (e.g. Message-ID) → take the next paragraph,
					-- but only if it's a real RFC-2822 fold (continuation starts with space/tab)
					if (v is "") and (i < (count of paras)) then
						set nextLine to (item (i + 1) of paras) as string
						if (nextLine starts with " ") or (nextLine starts with tab) then set v to my trimSpace(nextLine)
					end if
					set out to v
					exit repeat
				end if
			end repeat
		end try
	end tell
	return out
end headerValue

on hasClaude(mref)
	tell application "Microsoft Outlook"
		try
			set cl to categories of mref
			repeat with k from 1 to (count of cl)
				if (name of (item k of cl)) is "Claude" then return true
			end repeat
		end try
	end tell
	return false
end hasClaude

on toCsv(addrList)
	set AppleScript's text item delimiters to ","
	set s to addrList as string
	set AppleScript's text item delimiters to ""
	return s
end toCsv

on emitRecord(mref)
	set US to (ASCII character 31)
	tell application "Microsoft Outlook"
		set toList to {}
		try
			set rl to to recipients of mref
			repeat with ri from 1 to (count of rl)
				set rcpt to item ri of rl
				try
					set ea to email address of rcpt
					set end of toList to (address of ea)
				end try
			end repeat
		end try
		set fields to {(id of mref as string), (subject of mref), my senderAddr(mref), ¬
			my toCsv(toList), my isoDate(time received of mref), ¬
			my headerValue(mref, "Message-ID:"), my headerValue(mref, "Thread-Index:"), ¬
			((plain text content of mref) as string)}
	end tell
	set AppleScript's text item delimiters to US
	set out to (fields as string)
	set AppleScript's text item delimiters to ""
	return out
end emitRecord

on run argv
	set US to (ASCII character 31)
	set RS to (ASCII character 30)
	set theMode to item 1 of argv

	tell application "Microsoft Outlook"
		if theMode is "claude-capture" then
			set windowDays to (item 2 of argv) as integer
			set cutoff to (current date) - (windowDays * days)
			set recent to (messages of inbox whose time received > cutoff)
			set outRecs to {}
			repeat with i from 1 to (count of recent)
				set mref to item i of recent
				if my hasClaude(mref) then set end of outRecs to my emitRecord(mref)
			end repeat
			set AppleScript's text item delimiters to RS
			set s to outRecs as string
			set AppleScript's text item delimiters to ""
			return s

		else if theMode is "unread-capture" then
			set unreadMsgs to (messages of inbox whose is read is false)
			set outRecs to {}
			repeat with i from 1 to (count of unreadMsgs)
				set end of outRecs to my emitRecord(item i of unreadMsgs)
			end repeat
			set AppleScript's text item delimiters to RS
			set s to outRecs as string
			set AppleScript's text item delimiters to ""
			return s

		else if theMode is "clear" then
			if (count of argv) < 2 then return "cleared 0"
			set ids to items 2 thru -1 of argv
			set n to 0
			repeat with anId in ids
				try
					set m to (item 1 of (messages of inbox whose id is (anId as integer)))
					set keep to {}
					set cl to categories of m
					repeat with k from 1 to (count of cl)
						if (name of (item k of cl)) is not "Claude" then set end of keep to (item k of cl)
					end repeat
					set categories of m to keep
					set n to n + 1
				end try
			end repeat
			return "cleared " & (n as string)
		end if
	end tell
end run
