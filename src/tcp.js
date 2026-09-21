const net = require('node:net')

const SLVIDEO_PORT = 7891
const CONNECT_TIMEOUT_MS = 5000
const RECONNECT_DELAY_MS = 3000

const SD_MESSAGE_TYPES = {
	GET_SHORTCUT_LISTS: 'GetShortcutLists',
	START_SHORTCUT: 'StartShortcut',
	SET_GRID_SIZE: 'SetGridSize',
	SET_SHORTCUT_LISTS: 'SetShortcutLists',
	SHORTCUTS_OUT_OF_SYNC: 'ShortcutsOutOfSync',
}

function parseStructuredData(value) {
	let currentValue = value

	while (typeof currentValue === 'string') {
		const trimmed = currentValue.trim()
		if (!trimmed || !/^(?:\{|\[|"|-?\d|true|false|null)/.test(trimmed)) {
			break
		}

		try {
			currentValue = JSON.parse(trimmed)
		} catch {
			break
		}
	}

	return currentValue
}

class SLVideoTcpClient {
	constructor(options) {
		this.hardwareId = options.hardwareId
		this.port = options.port ?? SLVIDEO_PORT
		this.log = options.log
		this.onConnected = options.onConnected
		this.onDisconnected = options.onDisconnected
		this.onMessage = options.onMessage
		this.host = ''
		this.socket = null
		this.readBuffer = ''
		this.isConnected = false
		this.lastError = ''
		this.reconnectTimer = undefined
		this.connectTimer = undefined
	}

	connect(host) {
		const normalizedHost = String(host ?? '').trim()
		if (!normalizedHost) {
			this.disconnect()
			return
		}

		this.host = normalizedHost
		this.clearReconnectTimer()
		this.destroySocketSilently()
		this.openSocket()
	}

	disconnect() {
		this.host = ''
		this.clearReconnectTimer()
		this.destroySocketSilently()
		this.isConnected = false
	}

	destroy() {
		this.disconnect()
	}

	sendStreamDeckMessage(messageType, message) {
		if (!this.socket || !this.isConnected) {
			return false
		}

		const payload = {
			messageType: 'Text',
			strData: JSON.stringify({
				messageType,
				message: message ?? null,
			}),
		}

		this.socket.write(`${JSON.stringify(payload)}\n`)
		return true
	}

	openSocket() {
		const socket = new net.Socket()
		this.socket = socket
		this.readBuffer = ''
		this.lastError = ''
		this.isConnected = false

		socket.setEncoding('utf8')
		socket.setKeepAlive(true)
		this.clearConnectTimer()
		this.connectTimer = setTimeout(() => {
			if (socket !== this.socket || this.isConnected) {
				return
			}

			this.lastError = `Connection timed out after ${CONNECT_TIMEOUT_MS} ms`
			socket.destroy()
		}, CONNECT_TIMEOUT_MS)

		socket.on('connect', () => {
			if (socket !== this.socket) {
				return
			}

			this.clearConnectTimer()
			this.isConnected = true
			socket.write(`${this.hardwareId}3\n`)
			this.onConnected?.()
		})

		socket.on('data', (chunk) => {
			if (socket !== this.socket) {
				return
			}

			this.readBuffer += chunk
			let newlineIndex = this.readBuffer.indexOf('\n')

			while (newlineIndex !== -1) {
				const rawLine = this.readBuffer.slice(0, newlineIndex).trim()
				this.readBuffer = this.readBuffer.slice(newlineIndex + 1)

				if (rawLine) {
					this.handleLine(rawLine)
				}

				newlineIndex = this.readBuffer.indexOf('\n')
			}
		})

		socket.on('error', (error) => {
			if (socket !== this.socket) {
				return
			}

			this.lastError = error.message
			this.log?.('warn', `SLVideo TCP error: ${error.message}`)
		})

		socket.on('close', () => {
			if (socket !== this.socket) {
				return
			}

			this.clearConnectTimer()
			this.socket = null
			this.isConnected = false
			this.readBuffer = ''
			this.onDisconnected?.(this.lastError || 'Connection closed')

			if (this.host) {
				this.reconnectTimer = setTimeout(() => {
					this.reconnectTimer = undefined
					if (this.host && !this.socket) {
						this.openSocket()
					}
				}, RECONNECT_DELAY_MS)
			}
		})

		socket.connect(this.port, this.host)
	}

	handleLine(line) {
		let tcpMessage

		try {
			tcpMessage = JSON.parse(line)
		} catch (error) {
			this.log?.('warn', `Invalid TCP JSON received from SLVideo: ${error.message}`)
			return
		}

		if (tcpMessage.messageType !== 'Text') {
			return
		}

		if (tcpMessage.strData !== undefined) {
			this.onMessage?.(parseStructuredData(tcpMessage.strData))
		}
	}

	clearReconnectTimer() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
	}

	clearConnectTimer() {
		if (this.connectTimer) {
			clearTimeout(this.connectTimer)
			this.connectTimer = undefined
		}
	}

	destroySocketSilently() {
		this.clearConnectTimer()
		if (!this.socket) {
			return
		}

		this.socket.removeAllListeners()
		this.socket.destroy()
		this.socket = null
		this.readBuffer = ''
		this.isConnected = false
	}
}

module.exports = {
	SLVideoTcpClient,
	SLVIDEO_PORT,
	SD_MESSAGE_TYPES,
	parseStructuredData,
}
