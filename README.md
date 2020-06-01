# SpaceX ISS Simulator Autopilot
Successfully dock dragon capsule autonomously with a PD control architecture. Written in JS for ease of controlling simulator. 

Uses 6 separate PDs controllers for are used for yaw, pitch roll, x, y, and z. Symmetric limiters and gating logic are used too.

# Watch It In Action
[![Alt text](/img/youtube_thumbnail.png)](https://www.youtube.com/watch?v=v_r5uSaFCos)

# How To Run the Autopilot
1. Go to https://iss-sim.spacex.com
2. Press this keyboard combo: Ctrl + Shift + i
3. Navigate to the "Console" tab
4. Copy and paste the code in [spacex-iss-autopilot.js](https://raw.githubusercontent.com/handcraftedcode1/spacex-iss-simulator-autopilot/master/spacex-iss-autopilot.js) into the Console
5. Press enter
6. Click the "ENABLE KM AUTOPILOT v1.0" in the top-right corner of the screen
7. Watch the dragon capsule navigate and dock autonomously :-)
