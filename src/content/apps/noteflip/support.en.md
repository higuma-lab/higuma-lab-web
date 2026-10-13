---
app: noteflip
appName: NoteFlip
doc: support
lang: en
title: Support
description: Contact and frequently asked questions for NoteFlip, a score PDF viewer for Windows.
---

## Contact

Email: [support@higuma-lab.jp](mailto:support@higuma-lab.jp)

Please include:

- The version of NoteFlip ("…" menu > **About NoteFlip**) and of Windows
- Your PC and pen (and foot pedal, if the problem is about turning pages)
- What you did, what you expected, and what happened instead
- If you like, the log: "…" menu > **Open log folder**, and attach `noteflip.log`. It does not contain the names of your scores ([Privacy Policy](/apps/noteflip/en/privacy/)).

We usually reply within a few days.

## Frequently asked questions

### How does the free trial work?

You can use every feature free for 7 days. After the trial ends, NoteFlip does not start until you buy it from the Microsoft Store. Your scores and handwriting stay on your PC and are there as before once you buy. If you uninstall the app during the trial, they are deleted; to keep them, [back up your library](#backup) before the trial ends.

NoteFlip never stops while it is running because of the trial or the license, and it does not need an internet connection to start.

### Which keys turn pages? How do I use a foot pedal?

| Next page              | Previous page              |
| ---------------------- | -------------------------- |
| Page Down, →, ↓, Space | Page Up, ←, ↑, Shift+Space |

A Bluetooth foot pedal that works as a keyboard can turn pages if it is set to send one of these keys (for example Page Down and Page Up). Tapping or swiping the screen does not turn pages, so that you do not turn them by accident while playing.

### Does importing change or move my PDF files?

No. NoteFlip keeps a copy of each PDF in its own storage. Moving or deleting the original file does not affect the library, and your handwriting is stored separately from the PDF.

### What happens to my scores if I uninstall NoteFlip?

Windows deletes the app's data, including the imported scores, handwriting, folders and set lists. [Back up your library](#backup) first; you can restore it after you install NoteFlip again. To share or print a single score with its handwriting, export it as a PDF (**Export PDF...** in the "…" menu of the score, or on the score in the library).

<h3 id="backup">How do I back up my library or move it to a new PC?</h3>

Apps bought from the Microsoft Store are linked to your Microsoft account. When you move to a new PC after buying NoteFlip, install it from the Microsoft Store with the same account you used to buy it, and you do not need to buy it again. For how many devices you can use and other conditions, see [Microsoft's help](https://support.microsoft.com/en-us/accounts-billing/manage/manage-devices-used-with-your-microsoft-account). To move your scores and handwriting:

1. In the library, open the "…" menu and select **Back up library...**. Choose where to save the file (for example a USB drive or OneDrive). Every score, with its handwriting, and your folders and set lists go into one `.zip` file.
2. On the new PC (or after installing NoteFlip again), open the "…" menu in the library and select **Restore from backup...**, then choose the file. Before it starts, NoteFlip shows what is in the backup and which scores it will not add.

A restore only adds; it never replaces or removes anything. A score that is already in your library from this backup (for example from an earlier restore) is not added again; the one in your library is left as it is. If you imported the same PDF on the new PC before restoring, both copies are kept, and you can delete the one you do not need. If you cancel a restore, the scores restored so far stay, and restoring the same file again adds the rest.

Settings are not in the backup: set your page turn keys, pencil and highlighter colors and widths, and language again on the new PC.

You do not need to unpack the backup file. If you ever cannot use NoteFlip, you can open it in File Explorer: each score's PDF is `library\<id>\source.pdf` (this PDF does not include the handwriting; restoring the backup in NoteFlip brings the handwriting back), and `fileName` in `entry.json` in the same folder is its name, as explained in `README.txt` inside the file.

### How do I print a score with my handwriting?

Export it as a PDF, then select **Open** in the message that appears, and print from the PDF app that opens.

### How do I erase?

Hold the side button of the pen and touch a stroke, or choose an eraser on the toolbar: **whole strokes** removes every line it touches, **partial** removes only what it passes over. **Undo** and **Redo** are on the toolbar.

### How do I change the language?

"…" menu > **Language**: **Use Windows setting**, **English** or **日本語**. The change applies when you restart the app.

### Can I open a PDF from File Explorer?

Yes. Right-click a PDF, select **Open with** > **NoteFlip**. The file is added to the top of your library and opened.
