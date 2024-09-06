/*
 * Copyright 2018 Nikita Shakarun
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

package javax.wireless.messaging.impl;

import java.util.Date;

import javax.wireless.messaging.Message;

public class MessageImpl implements Message {

	private String address;
	private final long timestamp;

	public MessageImpl(String address, long timestamp) {
		this.address = address;
		this.timestamp = timestamp;
	}

	
	public String getAddress() {
		return address;
	}

	
	public Date getTimestamp() {
		if (timestamp == 0) {
			return null;
		}
		return new Date(timestamp);
	}

	
	public void setAddress(String address) {
		this.address = address;
	}
}
