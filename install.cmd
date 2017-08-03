@set @x=0 /*
@cscript/nologo /e:jscript "%~f0" "%~dp0fix!.cmd" "%~dp0"
@exit */
sh=WScript.CreateObject("WScript.Shell")
lk=sh.CreateShortcut(sh.SpecialFolders("Desktop")+"\\fix!.lnk")
lk.TargetPath=WScript.Arguments(0)
lk.WorkingDirectory = WScript.Arguments(1)
lk.Save()