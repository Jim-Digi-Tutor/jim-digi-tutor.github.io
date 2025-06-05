function calcMouth(landmarks) {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];

  const dy = Math.abs(lowerLip.y - upperLip.y);
  const openness = dy * 100; // Scale for easier reading

  return openness;
}

let mouthCooldown = false;

function detectMouthOpen(openness) {
  if (mouthCooldown) return;

  if (openness > 5) {
    console.log("😮 Mouth opened");
    mouthCooldown = true;

    setTimeout(() => {
      mouthCooldown = false;
    }, 1500);
  }
}

function calcBrows(landmarks) {
  const leftEyebrow = landmarks[105]; // Top of left eyebrow
  const leftEye = landmarks[159];     // Top of left eye (eyelid)

  const dy = leftEye.y - leftEyebrow.y; // Vertical distance

  const raise = dy * 100; // Scale for readability
  return raise;
}

let eyebrowCooldown = false;

function detectEyebrowGesture(raise) {
  if (eyebrowCooldown) return;

  if (raise > 5) {
    console.log("😲 Eyebrows raised!");
    eyebrowCooldown = true;

    setTimeout(() => {
      eyebrowCooldown = false;
    }, 1500);
  }
}