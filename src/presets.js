function hexToInt(hex) {
	return parseInt(String(hex).replace(/^#/, ''), 16) || 0
}

const LIVE_PROPERTIES = ['text', 'color', 'bgcolor', 'icon']

module.exports = function (self) {
	const presets = {}
	const presetIds = []
	const columns = self.getGridColumns()
	const rows = self.getGridRows()

	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			const shortcut = self.getShortcutForGridPosition({ row, column })
			const presetId = `slot_${row}_${column}`
			const locationLabel = `${row}/${column}`
			const name = shortcut ? `Row ${row} / Column ${column} - ${shortcut.name}` : `Row ${row} / Column ${column} empty`
			const slotOptions = { shortcutId: '', row, column }
			const color = hexToInt(shortcut?.foreColor || '#ffffff')
			const bgcolor = hexToInt(shortcut?.backColor || '#1f1f1f')
			const png64 = shortcut?.hasIcon && shortcut?.iconBase64 ? shortcut.iconBase64 : undefined
			const previewText = shortcut
				? shortcut.hasIcon && shortcut.iconBase64
					? ''
					: self.formatShortcutText(shortcut)
				: locationLabel
			const steps = [
				{
					name: 'Step 1',
					down: [
						{
							actionId: 'trigger_shortcut',
							options: slotOptions,
							headline: shortcut ? `Trigger shortcut for ${locationLabel}` : `No shortcut on ${locationLabel}`,
						},
					],
					up: [],
				},
			]

			presetIds.push(presetId)

			// Live variant: each element reads a local variable fed by the shortcut_property value feedback
			const layered = {
				type: 'layered',
				name,
				localVariables: LIVE_PROPERTIES.map((property) => ({
					variableName: `sl_${property}`,
					variableType: 'feedback',
					feedbackId: 'shortcut_property',
					options: { property, ...slotOptions },
					headline: `Shortcut ${property} for ${locationLabel}`,
				})),
				elements: [
					{
						type: 'box',
						name: 'Background',
						color: { isExpression: true, value: '$(local:sl_bgcolor)' },
					},
					{
						type: 'image',
						name: 'Icon',
						base64Image: { isExpression: true, value: '$(local:sl_icon)' },
						fillMode: 'fit',
					},
					{
						type: 'text',
						name: 'Text',
						text: { isExpression: true, value: '$(local:sl_text)' },
						color: { isExpression: true, value: '$(local:sl_color)' },
						fontsizeAllowShrink: true,
						halign: 'center',
						valign: 'center',
					},
				],
				feedbacks: [],
				steps,
			}

			// Fallback for hosts without layered buttons: colours and icon are fixed when the preset is placed
			const simple = {
				type: 'simple',
				name,
				style: {
					text: `$(${self.label}:slot_${row}_${column}_text)`,
					size: 'auto',
					color: 0xffffff,
					bgcolor: 0x1f1f1f,
				},
				previewStyle: {
					text: previewText,
					color,
					bgcolor,
					png64,
				},
				feedbacks: [
					{
						feedbackId: 'shortcut_available',
						options: slotOptions,
						style: png64 ? { color, bgcolor, png64 } : { color, bgcolor },
						headline: `Shortcut style for ${locationLabel}`,
					},
					{
						feedbackId: 'disconnected',
						options: {},
						style: {
							text: `Disconnected\n${locationLabel}`,
							color: 0xffffff,
							bgcolor: 0x7f1d1d,
						},
					},
				],
				steps,
			}

			presets[presetId] = {
				type: 'alternatives',
				variants: [layered, simple],
			}
		}
	}

	const structure = [
		{
			id: 'slvideo_grid',
			name: 'SLVideo Grid',
			definitions: presetIds,
		},
	]

	self.setPresetDefinitions(structure, presets)
}
