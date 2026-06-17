on trimText(s)
	set s to s as string
	repeat while s starts with " "
		set s to text 2 thru -1 of s
	end repeat
	repeat while s ends with " "
		set s to text 1 thru -2 of s
	end repeat
	return s
end trimText

on run argv
	set theMode to item 1 of argv
	set theSubject to item 2 of argv
	set theBody to item 3 of argv
	set recipientsCsv to item 4 of argv
	set imid to item 5 of argv

	tell application "Microsoft Outlook"
		if theMode is "fresh" then
			set m to make new outgoing message with properties {subject:theSubject, content:theBody}
			set AppleScript's text item delimiters to ","
			repeat with addrRef in (text items of recipientsCsv)
				set addr to my trimText(addrRef as string)
				if addr is not "" then
					make new recipient at m with properties {email address:{address:addr}}
				end if
			end repeat
			set AppleScript's text item delimiters to ""
			open m
		else
			-- reply: locate the original, then reply-all
			set subjMatch to my trimText(theSubject)
			set hits to (messages of inbox whose subject contains subjMatch)
			if (count of hits) is 0 then error "NOT_FOUND: no inbox message matches subject" number 1

			set target to missing value
			if imid is not "" then
				repeat with h in hits
					if (headers of h) contains imid then
						set target to (contents of h)
						exit repeat
					end if
				end repeat
			end if
			if target is missing value then set target to item 1 of hits

			set r to reply to target reply to all true without opening window
			set content of r to theBody & return & return & (content of r)
			open r
		end if
	end tell
end run
