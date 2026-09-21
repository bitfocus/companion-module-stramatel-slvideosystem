module.exports = function (self) {
	self.setActionDefinitions({
		trigger_shortcut: {
			name: 'Trigger shortcut',
			description: 'Trigger the SLVideo shortcut for the selected row/column unless a specific shortcut is selected.',
			options: self.getShortcutOptionFields(),
			callback: async (action) => {
				self.triggerShortcutForControl(null, action.options)
			},
		},
	})
}
