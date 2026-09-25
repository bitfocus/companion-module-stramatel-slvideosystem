const STYLE_PROPERTIES = ['text', 'color', 'bgcolor', 'icon']

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		shortcut_property: {
			name: 'Shortcut property',
			type: 'value',
			description:
				'Live text, colour or icon of the SLVideo shortcut, for use in a local variable driving the button style.',
			options: [
				{
					id: 'property',
					type: 'dropdown',
					label: 'Property',
					choices: [
						{ id: 'text', label: 'Text' },
						{ id: 'color', label: 'Text colour' },
						{ id: 'bgcolor', label: 'Background colour' },
						{ id: 'icon', label: 'Icon (base64 PNG)' },
					],
					default: 'text',
				},
				...self.getShortcutOptionFields(),
			],
			callback: (feedback) => {
				const property = String(feedback.options.property)
				if (!STYLE_PROPERTIES.includes(property)) {
					return null
				}

				return self.getShortcutStyleForControl(null, feedback.options)[property]
			},
		},
		shortcut_available: {
			name: 'Shortcut available',
			type: 'boolean',
			description:
				'Change the button style while connected and an SLVideo shortcut matches the selected row/column or shortcut.',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0x1f4f7f,
			},
			options: self.getShortcutOptionFields(),
			callback: (feedback) => {
				return self.client.isConnected && !!self.getShortcutForControl(null, feedback.options)
			},
		},
		disconnected: {
			name: 'SLVideo disconnected',
			type: 'boolean',
			description: 'Change the button style while the connection to SLVideo is down.',
			defaultStyle: {
				text: 'Disconnected',
				color: 0xffffff,
				bgcolor: 0x7f1d1d,
			},
			options: [],
			callback: () => {
				return !self.client.isConnected
			},
		},
	})
}
