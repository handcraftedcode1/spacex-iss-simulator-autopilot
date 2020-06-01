//
// UTILITY FUNCTIONS - Reading of DOF and actuation UI inputs
//

function trigger_button(keyCode) {
	document.dispatchEvent(new KeyboardEvent("keydown", {which: keyCode, keyCode: keyCode}));

	setTimeout(function() {
		document.dispatchEvent(new KeyboardEvent("keyup", {which: keyCode, keyCode: keyCode}));
	}, 0.5)
}

function pitch_up() {
	trigger_button(104);
}

function pitch_down() {
	trigger_button(101);
}

function yaw_left() {
	trigger_button(100);
}

function yaw_right() {
	trigger_button(102);
}

function roll_left() {
	trigger_button(103);
}

function roll_right() {
	trigger_button(105);
}

function translate_left() {
	trigger_button(65);
}

function translate_right() {
	trigger_button(68);
}

function translate_up() {
	trigger_button(87);
}

function translate_down() {
	trigger_button(83);
}

function translate_forward() {
	trigger_button(69);
}

function translate_backward() {
	trigger_button(81);
}

function get_pitch_rate() {
	return parseFloat($("#pitch .rate").innerText);
}

function get_yaw_rate() {
	return parseFloat($("#yaw .rate").innerText);
}

function get_roll_rate() {
	return parseFloat($("#roll .rate").innerText);
}

function get_yaw() {
	return parseFloat($("#yaw .error").innerText);
}

function get_pitch() {
	return parseFloat($("#pitch .error").innerText);
}

function get_roll() {
	return parseFloat($("#roll .error").innerText);;
}

function get_vehicle_xyz() {
	var x = parseFloat($("#x-range > div").innerText);
	var y = parseFloat($("#y-range > div").innerText);
	var z = parseFloat($("#z-range > div").innerText);
	return new THREE.Vector3(x,y,z);
}

function get_linear_velocity() {
	return parseFloat($("#rate > div.rate").innerText);
}

var autoEnabled = false;

function toggleAuto() {
	autoEnabled = ! autoEnabled;
	$("#auto-toggle").innerText = autoEnabled ? "DISABLE KM AUTOPILOT v1.0" : "ENABLE KM AUTOPILOT v1.0";
}

// inject a custom autopilot button
document.getElementById("options").insertAdjacentHTML('beforeend',
    `<div style="position: fixed; left: 50%; margin-left: 290px; top:0px">
        <div onclick="toggleAuto()" id="auto-toggle" class="message-button" style="display: inline-block; text-align: center; margin: 15px;">ENABLE KM AUTOPILOT v1.0</div>
    </div>`
);

//
// CONTROL PARAMETERS
//
var ERROR_TOLERANCE = 0.4;

// rotational PD controller paramters
var p_rotation = 0.51;
var d_rotation = 0.80;

// Y and Z translation. y-axis is left to right. z-axis up and down.
var p_yz_translation = 0.14;
var d_yz_translation = 0.90;

// X translation. x-axis is towards the station.
var p_x_translation = 0.08; // tune this for more thrust or less thrust
var d_x_translation = 1.5; // tune this to resist motion

// limit angular velocity
var max_angular_velocity = 2.5;

// estimated vehicle velocity vector
var estimated_velocity = new THREE.Vector3(0,0,0);

// current vehicle position
var current_position = get_vehicle_xyz();

// strange duty cycle of the translation thrusters
var duty_cycle_translation = new THREE.Vector3(0,0,0);

var dt = 0.1;  // deltaTime in seconds
var dt_velocity = 1; // delay between velocity update

var loop_count = 0;
var velocity_interval = Math.round(dt_velocity / dt);

//
// CONTROL LOOP
//
setInterval(control_loop, dt * 1000);

function control_loop() {

	if (!autoEnabled) {
		return;
	}

	loop_count++;

    var yaw = get_yaw();
    var pitch = get_pitch();
	var roll = get_roll();

	pitch_correction(); // pitch PD controller
    yaw_correction(); // yaw PD controller
    roll_correction(); // roll PD controller

    // translation (xyz) PD controller
	if (Math.abs(pitch) + Math.abs(yaw) + Math.abs(roll) <= 3 * ERROR_TOLERANCE) {
        // translate only if total error angle is small
		translation_correction();
    }
    
}

function pitch_correction() {

	var pitch_rate = get_pitch_rate();
	var pitch = get_pitch();

	var pitch_setpoint = Math.round((pitch * p_rotation - pitch_rate * d_rotation) * 10) / 10;
	if (pitch_rate < pitch_setpoint && pitch_rate < max_angular_velocity) {
		pitch_down();
	}
	else if (pitch_rate > pitch_setpoint && pitch_rate > -max_angular_velocity) {
		pitch_up();
	}
}

function yaw_correction() {

	var yaw_rate = get_yaw_rate();
	var yaw = get_yaw();

	var yaw_setpoint = Math.round((yaw * p_rotation - yaw_rate * d_rotation) * 10) / 10;

	if (yaw_rate < yaw_setpoint && yaw_rate < max_angular_velocity) {
		yaw_right();
	}
	else if (yaw_rate > yaw_setpoint && yaw_rate > -max_angular_velocity) {
		yaw_left();
	}
}

function roll_correction() {

    // roll PD controller
	var roll_rate = get_roll_rate();
	var roll = get_roll();

	var roll_setpoint = Math.round((roll * p_rotation - roll_rate * d_rotation) * 10) / 10;

	if (roll_rate < roll_setpoint && roll_rate < max_angular_velocity) {
		roll_right();
	}
	else if (roll_rate > roll_setpoint && roll_rate > -max_angular_velocity) {
		roll_left();
	}

}

function translation_correction() {

	var current_position_xyz = get_vehicle_xyz();

    // update velocity estimate
	if (loop_count % velocity_interval === 0) {
		estimated_velocity = current_position_xyz.clone().sub(current_position).divideScalar(dt_velocity);
		current_position = current_position_xyz.clone();
	}
	
	// use displayed rate if only moving in x direction
	if (estimated_velocity.x * estimated_velocity.y === 0) {
		estimated_velocity.x = get_linear_velocity();
	}

	duty_cycle_translation.x = Math.min(1, Math.max(-1, current_position_xyz.x * p_x_translation + estimated_velocity.x * d_x_translation));
	duty_cycle_translation.y = Math.min(1, Math.max(-1, current_position_xyz.y * p_yz_translation + estimated_velocity.y * d_yz_translation));
	duty_cycle_translation.z = Math.min(1, Math.max(-1, current_position_xyz.z * p_yz_translation + estimated_velocity.z * d_yz_translation));

	console.log(duty_cycle_translation);

    // "duty cycle" is off, do nothing
	if (loop_count % velocity_interval >= velocity_interval * Math.abs(duty_cycle_translation.x) || Math.abs(current_position_xyz.y) + Math.abs(current_position_xyz.z) > 45) {
    }
	else if (duty_cycle_translation.x > 0) {
		translate_forward();
    }
    // don't change if moving slowly forwards
	else if (duty_cycle_translation.x < -0.1) {
		translate_backward();
	}

    // "duty cycle" is off, do nothing
	if (loop_count % velocity_interval >= velocity_interval * Math.abs(duty_cycle_translation.y)) {
	}
	else if (duty_cycle_translation.y > 0) {
		translate_left();
	}
	else if (duty_cycle_translation.y < 0) {
		translate_right();
	}
	
	// "duty cycle" is off, do nothing
	if (loop_count % velocity_interval >= velocity_interval * Math.abs(duty_cycle_translation.z)) {
	}
	else if (duty_cycle_translation.z > 0) {
		translate_down();
	}
	else if (duty_cycle_translation.z < 0) {
		translate_up();
	}
	
}