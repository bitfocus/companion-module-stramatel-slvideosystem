function hexToInt(hex) {
	return parseInt(String(hex).replace(/^#/, ''), 16) || 0
}

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
			const previewText = shortcut
				? shortcut.hasIcon && shortcut.iconBase64
					? ''
					: self.formatShortcutText(shortcut)
				: locationLabel

			presetIds.push(presetId)

			presets[presetId] = {
				type: 'simple',
				name: shortcut ? `Row ${row} / Column ${column} - ${shortcut.name}` : `Row ${row} / Column ${column} empty`,
				style: {
					text: '',
					size: 'auto',
					color: 0xffffff,
					bgcolor: 0x1f1f1f,
				},
				previewStyle: {
					text: previewText,
					color: hexToInt(shortcut?.foreColor || '#ffffff'),
					bgcolor: hexToInt(shortcut?.backColor || '#1f1f1f'),
					png64: shortcut?.hasIcon && shortcut?.iconBase64 ? shortcut.iconBase64 : undefined,
				},
				feedbacks: [
					{
						feedbackId: 'shortcut_state',
						options: {
							shortcutId: '',
							row,
							column,
						},
						headline: shortcut ? `Display slot ${locationLabel}` : `No shortcut on ${locationLabel}`,
					},
				],
				steps: [
					{
						name: 'Step 1',
						down: [
							{
								actionId: 'trigger_shortcut',
								options: {
									shortcutId: '',
									row,
									column,
								},
								headline: shortcut ? `Trigger shortcut for ${locationLabel}` : `No shortcut on ${locationLabel}`,
							},
						],
						up: [],
					},
				],
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
