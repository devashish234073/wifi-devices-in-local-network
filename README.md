# wifi-devices-in-local-network

TO run:
1. clone this repo and cd to its directory
2. do npm install
3. node index.js
4. If you want to setup adb also , bofore #2 do the below
5. If you have terraform installed in your machine
6. do terraform init
7. and then
8. terraform apply
9. if you dont have terraform you can donwload and setup adb by following this video https://www.youtube.com/watch?v=TkMhG-iGWPs
10. Follow the same video to setup adb on TV

Check this video for explanation: https://www.youtube.com/watch?v=v6kG2t6i_Yg

![image](https://github.com/user-attachments/assets/161de2cc-49be-4771-8df3-35b9c4c817d3)

added more option for android tv device to cast media from laptop:

Check this post for more details:

https://www.linkedin.com/feed/update/urn:li:ugcPost:7237350981519212545/

And this video for explanation: https://www.youtube.com/watch?v=hEE60a8NFSA

Latest screenshot: ![image](https://github.com/user-attachments/assets/2d581d16-4cb2-42fb-9e3f-07d989855389)

Added controls under adb for listing, launching and adding exclusion rules.

![image](https://github.com/user-attachments/assets/1d523220-f680-4ea2-9ef1-0b19c9552ea5)

The dropdown shows apps package name which is from the output of the below command:

"adb shell pm list packages"

To launch an app from the package name from the list, this command is being run:

"adb shell monkey -p ${package} -c android.intent.category.LAUNCHER 1"

Also there is an exclusion text box using which rules can be created for app logs to close the app when the rule matches.

For example in this video I set the first rule on "NowPlaying,Kabootar" for teh youtube app so whenever youtube logs the Text NowPlaying and Kabootar together i.e. when the song "Kabootar Ja Ja" is being played on the tv, the app triggers a back command and closes it. The video plays for few seconds as the "logcat" command to check the app logs runs every 2 seconds.

