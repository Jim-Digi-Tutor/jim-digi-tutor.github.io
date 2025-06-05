let rollNeutral = null;

function calcZ(landmarks) {
  const leftEyeTop = landmarks[159];  // top of left eye
  const rightEyeTop = landmarks[386]; // top of right eye

  // Vertical difference between eyes
  const deltaY = leftEyeTop.y - rightEyeTop.y;

  // Set baseline roll when first measured
  if (rollNeutral === null) {
    rollNeutral = deltaY;
  }

  const delta = deltaY - rollNeutral;

  // Convert to degrees-ish
  const rollDegrees = delta * 300; // Adjust scale to taste
  return rollDegrees;
}

let rollCooldown = false;
let pitchCooldown = false;

function detectRollGesture(roll) {
  if (rollCooldown) return;

  if (roll > 20) {
    console.log("↩️ Head Tilted Left");
    rollCooldown = true;
  } else if (roll < -20) {
    console.log("↪️ Head Tilted Right");
    rollCooldown = true;
  }

  setTimeout(() => {
    rollCooldown = false;
  }, 1500);
}


let cooldown = false;

function calcY(landmarks) {
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const nose = landmarks[1];

  const faceWidth = rightCheek.x - leftCheek.x;
  const centerX = (leftCheek.x + rightCheek.x) / 2;

  const yawRatio = (nose.x - centerX) / faceWidth;
  const yawDegrees = yawRatio * 90; // scale to ±90°

  return yawDegrees;
}


let pitchNeutralY = null;
function calcX(landmarks) {
  const nose = landmarks[1];
  const leftEye = landmarks[159];
  const rightEye = landmarks[386];

  const eyeAvgY = (leftEye.y + rightEye.y) / 2;
  const noseToEyeY = nose.y - eyeAvgY;

  // Set baseline when first measured
  if (pitchNeutralY === null) {
    pitchNeutralY = noseToEyeY;
  }

  // Compare current nose position to neutral
  const delta = noseToEyeY - pitchNeutralY;

  // Scale for readability (~degrees)
  const pitchDegrees = delta * 300;
  return pitchDegrees;
}  

      function detectDirection(yaw) {

        if (cooldown) return;

        if (yaw > 35) {
          console.log("👉 Turned Left ~90°");
          cooldown = true;
        } else if (yaw < -35) {
          console.log("👈 Turned Right ~90°");
          cooldown = true;
        }

        setTimeout(() => {
          cooldown = false;
        }, 1500);
      }

      function detectPitchGesture(pitch) {
        if (pitchCooldown) return;

        if (pitch > 20) {
          console.log("👇 Nodded Down");
          pitchCooldown = true;
        } else if (pitch < -15) {
          console.log("👆 Nodded Up");
          pitchCooldown = true;
        }

        setTimeout(() => {
          pitchCooldown = false;
        }, 1500);
      }      
