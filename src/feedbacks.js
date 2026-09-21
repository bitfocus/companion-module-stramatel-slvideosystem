module.exports = async function (self) {
	self.setFeedbackDefinitions({
		shortcut_state: {
			name: 'Shortcut visual state',
			type: 'advanced',
			description: 'Display the SLVideo shortcut for the selected row/column unless a specific shortcut is selected.',
			options: self.getShortcutOptionFields(),
			callback: async (feedback) => {
				return self.getShortcutFeedbackStyleForControl(null, feedback.options)
			},
		},
	})
}
