export default {
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: './index.html',
				'src/audio-player': './src/audio-player.js',
				'styles/main.css': './styles/main.css',
			},
			output: {
				entryFileNames: '[name].js',
				assetFileNames: 'assets/[name][extname]',
			},
		},
	},
}
