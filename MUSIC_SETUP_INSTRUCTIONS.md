# Step-by-Step Guide: Adding Background Music to Math Game

## Overview
This guide will help you add background music to your Math Game. The music system is already implemented in the code - you just need to add your audio file.

---

## Step 1: Prepare Your Audio File

1. **Choose an audio file** (recommended formats: `.mp3`, `.wav`, `.ogg`)
   - File should be appropriate for background music (not too loud, loopable)
   - Recommended length: 30 seconds to 2 minutes (it will loop automatically)
   - File size: Keep it under 5MB for better performance

2. **Rename your file** (optional but recommended)
   - Example: `math-game-bg-music.mp3`
   - Place it in the `public` folder of your project

---

## Step 2: Add Audio File to Project

1. **Navigate to your project folder**
   ```
   C:\Users\User\castone\public\
   ```

2. **Copy your audio file** into the `public` folder
   - The file should be directly in the `public` folder
   - Example path: `C:\Users\User\castone\public\math-game-bg-music.mp3`

---

## Step 3: Update the Audio Source in Code

1. **Open the MathGame.js file**
   - Location: `src/components/games/MathGame.js`

2. **Find the audio element** (around line 195-200)
   ```javascript
   <audio
     ref={audioRef}
     loop
     preload="auto"
   >
     <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
     <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" type="audio/mpeg" />
     Your browser does not support the audio element.
   </audio>
   ```

3. **Replace the source URLs with your file path**
   ```javascript
   <audio
     ref={audioRef}
     loop
     preload="auto"
   >
     <source src="/math-game-bg-music.mp3" type="audio/mpeg" />
     Your browser does not support the audio element.
   </audio>
   ```
   
   **Important Notes:**
   - Use `/filename.mp3` (with leading slash) to reference files in the `public` folder
   - The path is relative to the `public` folder
   - You can add multiple `<source>` tags for different formats as fallbacks

---

## Step 4: Test the Music

1. **Start your development server** (if not already running)
   ```bash
   npm start
   ```

2. **Navigate to the Math Game** in your browser

3. **Check the music button** (🔊 icon in top-right corner)
   - Click it to toggle music on/off
   - Music should start automatically when the game loads

4. **Verify the music:**
   - Music should loop continuously
   - Volume should be at 30% (adjustable in code)
   - Music should pause when you click the mute button (🔇)

---

## Step 5: Adjust Volume (Optional)

If you want to change the music volume:

1. **Find the volume setting** in `MathGame.js` (around line 125)
   ```javascript
   audioRef.current.volume = 0.3; // Set volume to 30%
   ```

2. **Change the value:**
   - `0.0` = Silent (0%)
   - `0.5` = Half volume (50%)
   - `1.0` = Full volume (100%)
   - Example: `0.5` for 50% volume

---

## Step 6: Troubleshooting

### Music doesn't play automatically?
- **Browser autoplay policy**: Some browsers block autoplay. Users may need to interact with the page first (click anywhere) before music plays.
- **Solution**: The music will start when the user clicks the play button (🔊)

### Music file not found?
- **Check the file path**: Make sure the file is in the `public` folder
- **Check the filename**: Ensure the filename in code matches exactly (case-sensitive)
- **Check file format**: Use `.mp3`, `.wav`, or `.ogg` format

### Music too loud/quiet?
- Adjust the volume in Step 5 above
- Or edit the audio file itself to normalize the volume

### Music doesn't loop?
- The `loop` attribute should be set in the `<audio>` tag
- Check that `loop` is present: `<audio ref={audioRef} loop preload="auto">`

---

## Current Implementation Details

The music system includes:

✅ **Audio element** with looping enabled
✅ **Music toggle button** (🔊/🔇) in the header
✅ **Auto-play** functionality (may require user interaction due to browser policies)
✅ **Volume control** (set to 30% by default)
✅ **State management** for play/pause

---

## File Structure

```
castone/
├── public/
│   ├── math-game-bg-music.mp3  ← Your audio file goes here
│   ├── bg.mp4
│   └── ...
└── src/
    └── components/
        └── games/
            ├── MathGame.js      ← Audio code is here
            └── MathGame.css     ← Music button styles here
```

---

## Quick Reference: Code Locations

1. **Audio element**: `MathGame.js` line ~195
2. **Music state**: `MathGame.js` line ~83
3. **Music toggle function**: `MathGame.js` line ~155
4. **Volume setting**: `MathGame.js` line ~125
5. **Music button**: `MathGame.js` line ~200
6. **Button styles**: `MathGame.css` line ~42

---

## Example: Complete Audio Setup

If your file is named `background-music.mp3` and placed in the `public` folder:

```javascript
<audio
  ref={audioRef}
  loop
  preload="auto"
>
  <source src="/background-music.mp3" type="audio/mpeg" />
  Your browser does not support the audio element.
</audio>
```

That's it! The music system is ready to use. 🎵

