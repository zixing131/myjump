/*
 * Copyright 2020 Nikita Shakarun
 * Copyright 2020 Yury Kharchenko
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.vodafone.v10.system.device;

public class DeviceControl {
	public static final int BATTERY = 1;
	public static final int FIELD_INTENSITY = 2;
	public static final int KEY_STATE = 3;
	public static final int VIBRATION = 4;
	public static final int BACK_LIGHT = 5;
	public static final int EIGHT_DIRECTIONS = 6;

	private static DeviceControl instance;

	public static synchronized DeviceControl getDefaultDeviceControl() {
		if (instance == null) {
			instance = new DeviceControl();
		}
		return instance;
	}

	public static void setMailListener(MailListener listener) {
	}

	public static void setRingStateListener(RingStateListener listener) {
	}

	public static void setScheduledAlarmListener(ScheduledAlarmListener listener) {
	}

	public static void setTelephonyListener(TelephonyListener listener) {
	}

	public void blink(int lighting, int extinction, int repeat) {
	}

	public int getDeviceState(int deviceNo) {
		switch (deviceNo) {
			case BATTERY:
			case FIELD_INTENSITY:
				return 100;
			case KEY_STATE:
				// zb3: todo
				System.out.println("unimplemented vodafone key state");
				return 0;
			default:
				throw new IllegalStateException();
		}
	}

	public boolean getKeyRepeatState(int key) {
		return false;
	}

	public boolean isDeviceActive(int deviceNo) {
		return false;
	}

	public boolean setDeviceActive(int deviceNo, boolean active) {
		switch (deviceNo) {
			case BACK_LIGHT:
			case EIGHT_DIRECTIONS:
				break;
			case VIBRATION:
				break;
			default:
				throw new IllegalStateException();
		}
		return true;
	}

	public boolean setKeyRepeatState(int key, boolean state) {
		return false;
	}
}
