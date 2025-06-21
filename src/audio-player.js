/* ==============================
1. DOM Elements
2. Application status
3. Initializing the application
4. Loading audio files from local storage
5. Events
6. Loading playlists
7. Volume icon update
8. Volume
9. Switch: "Audiofiles / Playlists"
10. "More details" page
11. Delete audio file button
12. Logic for deleting an audio file
13. I forgot what it is, but it's related to the next play
14. Genres
15. Playlists
16. Displaying audio files in a playlist
17. Removing audio files from a playlist
18. Playing playlists
19. Clearing notifications
20. Modal window for creating a playlist
21. Create a playlist
22. Playlist render
23. Play audio file
24. Play button update
25. Update information about the current audio file
26. Highlighting the current audio file in the playlist
27. Switch to the next audio file
28. Switch to the previous audio file
29. Search for audio files
30. Downloading audio files
31. Processing uploaded audio files
32. Deleting an audio file
33. Updating all sections
34. Audio file analysis
35. Duration formatting
36. Getting the name of the genre
37, Notifications
38. Hide notification
39. Additional for notifications 
40. Adding a notification to the notifications section
41. Page Switcher "Bottom Panel"
42. Page swiping system
43. Launching the application 
============================== */

document.addEventListener('DOMContentLoaded', function () {
	// ============= DOM Elements ============= //
	const audioPlayer = document.getElementById('audio-player')
	const playBtn = document.getElementById('play-btn')
	const prevBtn = document.getElementById('prev-btn')
	const nextBtn = document.getElementById('next-btn')
	const progressBar = document.querySelector('.progress-bar')
	const currentTimeEl = document.querySelector('.current-time')
	const durationEl = document.querySelector('.duration')
	const songTitleEl = document.querySelector('.song-title')
	const songArtistEl = document.querySelector('.song-artist')
	const playlistEl = document.getElementById('playlist')
	const searchInput = document.getElementById('search-input')
	const searchBtn = document.getElementById('search-btn')
	const searchResults = document.getElementById('search-results')
	const uploadArea = document.getElementById('upload-area')
	const fileInput = document.getElementById('file-input')
	const uploadStatus = document.getElementById('upload-status')
	const navBtns = document.querySelectorAll('.nav-btn')
	const pages = document.querySelectorAll('.page')
	const volumeBtn = document.getElementById('volume-btn')
	const volumeSlider = document.getElementById('volume-slider')

	// ============= Application status ============= //
	let currentSongIndex = 0
	let songs = []
	let allTracks = []
	let currentGenreFilter = 'all'
	let isPlaying = false
	let playlists = []
	let currentPlaylistId = null

	// ============= Initializing the application ============= //
	function init() {
		loadSongs()
		setupEventListeners()
		loadPlaylists()
		setupSwipeNavigation()

		const savedVolume = parseFloat(localStorage.getItem('volume')) || 1
		audioPlayer.volume = savedVolume
		volumeSlider.value = savedVolume

		updateVolumeIcon()
		setupVolumeSlider()
		setupViewSwitcher()
	}

	// ============= Loading audio files from local storage ============= //
	function loadSongs() {
		const savedTracks = localStorage.getItem('allTracks')
		if (savedTracks) {
			allTracks = JSON.parse(savedTracks)
			songs = [...allTracks]
		} else {
			/*allTracks = [
				{
					title: 'Test',
					artist: 'Test',
					src: 'music/test.mp3',
					duration: '2:30',
					genre: 'rock',
					isCustom: false,
				},*/
			songs = [...allTracks]
		}

		renderPlaylist()
		renderAllTracks()
		setupGenreFilters()
	}

	// ============= Events ============= //
	function setupEventListeners() {
		document.querySelectorAll('#playlist-modal .close-modal').forEach(btn => {
			btn.addEventListener('click', function () {
				document.getElementById('playlist-modal').style.display = 'none'
			})
		})

		document
			.getElementById('save-playlist')
			.addEventListener('click', createPlaylist)
		document
			.getElementById('create-playlist-btn')
			.addEventListener('click', showCreatePlaylistModal)

		document
			.getElementById('clear-notifications-btn')
			.addEventListener('click', clearAllNotifications)

		// Control buttons
		playBtn.addEventListener('click', () => {
			if (songs.length === 0) return

			if (isPlaying) {
				audioPlayer.pause()
			} else {
				audioPlayer.play()
			}
			isPlaying = !isPlaying
			updatePlayButton()
		})

		prevBtn.addEventListener('click', prevSong)
		nextBtn.addEventListener('click', nextSong)

		// Progress bar
		audioPlayer.addEventListener('timeupdate', () => {
			const { currentTime, duration } = audioPlayer
			const progressPercent = (currentTime / duration) * 100
			progressBar.style.width = `${progressPercent}%`

			// Time formatting
			const formatTime = time => {
				const minutes = Math.floor(time / 60)
				const seconds = Math.floor(time % 60)
				return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
			}

			currentTimeEl.textContent = formatTime(currentTime)

			if (!isNaN(duration)) {
				durationEl.textContent = formatTime(duration)
			}
		})

		volumeSlider.addEventListener('input', function () {
			const percent = this.value * 100
			this.style.setProperty('--progress-percent', `${percent}%`)
		})

		volumeSlider.style.setProperty(
			'--progress-percent',
			`${volumeSlider.value * 100}%`
		)

		// Click on the progress bar
		const progressContainer = document.querySelector('.progress-container')
		progressContainer.addEventListener('click', e => {
			const width = progressContainer.clientWidth
			const clickX = e.offsetX
			const duration = audioPlayer.duration
			audioPlayer.currentTime = (clickX / width) * duration
		})

		audioPlayer.addEventListener('ended', nextSong)

		searchBtn.addEventListener('click', () => {
			searchSongs(searchInput.value)
		})

		searchInput.addEventListener('keypress', e => {
			if (e.key === 'Enter') {
				searchSongs(searchInput.value)
			}
		})

		uploadArea.addEventListener('click', function (e) {
			if (e.target === this) {
				fileInput.click()
			}
		})

		uploadArea.addEventListener('dragover', e => {
			e.preventDefault()
			uploadArea.style.borderColor = 'var(--primary-color)'
			uploadArea.style.backgroundColor = 'var(--dark-tertiary)'
		})

		uploadArea.addEventListener('dragleave', () => {
			uploadArea.style.borderColor = 'var(--text-secondary)'
			uploadArea.style.backgroundColor = 'transparent'
		})

		uploadArea.addEventListener('drop', e => {
			e.preventDefault()
			uploadArea.style.borderColor = 'var(--text-secondary)'
			uploadArea.style.backgroundColor = 'transparent'

			const files = e.dataTransfer.files
			const audioFiles = Array.from(files).filter(file =>
				file.type.startsWith('audio/')
			)

			if (audioFiles.length > 0) {
				handleFileUpload(audioFiles)
			} else {
				uploadStatus.textContent = 'Пожалуйста, загружайте только аудиофайлы'
				uploadStatus.style.color = '#ff4d4d'
			}
		})

		fileInput.addEventListener('change', () => {
			const files = fileInput.files
			const audioFiles = Array.from(files).filter(file =>
				file.type.startsWith('audio/')
			)

			if (audioFiles.length > 0) {
				handleFileUpload(audioFiles)
			} else {
				uploadStatus.textContent = 'Пожалуйста, выберите аудиофайлы'
				uploadStatus.style.color = '#ff4d4d'
			}
		})

		navBtns.forEach(btn => {
			btn.addEventListener('click', () => {
				switchPage(btn.dataset.page)
			})
		})

		// Volume control
		volumeSlider.addEventListener('input', () => {
			audioPlayer.volume = volumeSlider.value
			localStorage.setItem('volume', volumeSlider.value)
			updateVolumeIcon()
		})

		volumeBtn.addEventListener('click', () => {
			if (audioPlayer.volume > 0) {
				localStorage.setItem('lastVolume', audioPlayer.volume)
				audioPlayer.volume = 0
				volumeSlider.value = 0
			} else {
				const lastVolume = parseFloat(localStorage.getItem('lastVolume')) || 1
				audioPlayer.volume = lastVolume
				volumeSlider.value = lastVolume
			}
			updateVolumeIcon()
		})

		// Create and customize a circle
		const progressHandle = document.createElement('div')
		progressHandle.className = 'progress-handle'
		progressContainer.appendChild(progressHandle)

		// Drag state
		let isDragging = false
		let dragStartX = 0
		let dragStartLeft = 0

		// Correctly update the circle position
		const updateHandlePosition = (force = false) => {
			if (isDragging && !force) return

			const percent =
				(audioPlayer.currentTime / audioPlayer.duration) * 100 || 0
			progressHandle.style.left = `${percent}%`
		}

		// Show/hide circle
		progressContainer.addEventListener('mouseenter', () => {
			progressHandle.style.opacity = '1'
			updateHandlePosition(true)
		})

		progressContainer.addEventListener('mouseleave', () => {
			if (!isDragging) progressHandle.style.opacity = '0'
		})

		// Start dragging
		progressHandle.addEventListener('mousedown', e => {
			e.preventDefault()
			e.stopPropagation()

			isDragging = true
			dragStartX = e.clientX
			dragStartLeft = parseFloat(progressHandle.style.left) || 0

			progressHandle.style.transform = 'translate(-50%, -50%) scale(1.5)'
			document.body.style.userSelect = 'none'
		})

		// Drag and drop
		document.addEventListener('mousemove', e => {
			if (!isDragging) return

			const containerRect = progressContainer.getBoundingClientRect()
			const deltaX = e.clientX - dragStartX
			const newLeft = Math.max(
				0,
				Math.min(100, dragStartLeft + (deltaX / containerRect.width) * 100)
			)

			progressHandle.style.left = `${newLeft}%`
			audioPlayer.currentTime = (newLeft / 100) * audioPlayer.duration
		})

		// End of drag
		document.addEventListener('mouseup', e => {
			if (!isDragging) return

			isDragging = false
			document.body.style.userSelect = ''
			progressHandle.style.transform = 'translate(-50%, -50%) scale(1)'

			// If the cursor is outside the container, hide the circle
			const rect = progressContainer.getBoundingClientRect()
			if (
				e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom
			) {
				progressHandle.style.opacity = '0'
			}
		})

		audioPlayer.addEventListener('timeupdate', () => {
			if (!isDragging) updateHandlePosition()
		})

		progressContainer.addEventListener('click', e => {
			if (isDragging) {
				e.preventDefault()
				e.stopPropagation()
				return
			}

			const rect = progressContainer.getBoundingClientRect()
			const percent = (e.clientX - rect.left) / rect.width
			audioPlayer.currentTime = percent * audioPlayer.duration
		})

		playBtn.addEventListener('touchstart', e => {
			e.preventDefault()
			if (songs.length === 0) return

			if (isPlaying) {
				audioPlayer.pause()
			} else {
				audioPlayer.play()
			}
			isPlaying = !isPlaying
			updatePlayButton()
		})
	}

	// ============= Loading playlists ============= //
	function loadPlaylists() {
		const savedPlaylists = localStorage.getItem('playlists')
		if (savedPlaylists) {
			playlists = JSON.parse(savedPlaylists)
			renderPlaylists()
		}
	}

	// ============= Volume icon update ============= //
	function updateVolumeIcon() {
		const icon = volumeBtn.querySelector('i')
		if (audioPlayer.volume === 0) {
			icon.classList.replace('fa-volume-up', 'fa-volume-mute')
			icon.classList.replace('fa-volume-down', 'fa-volume-mute')
			icon.style.color = 'red'
		} else if (audioPlayer.volume < 0.5) {
			icon.classList.replace('fa-volume-up', 'fa-volume-down')
			icon.classList.replace('fa-volume-mute', 'fa-volume-down')
			icon.style.color = 'white'
		} else {
			icon.classList.replace('fa-volume-down', 'fa-volume-up')
			icon.classList.replace('fa-volume-mute', 'fa-volume-up')
			icon.style.color = 'white'
		}
	}
	// ============= Volume ============= //
	function setupVolumeSlider() {
		volumeSlider.style.setProperty('--slider-thumb-color', 'white')
		volumeSlider.style.setProperty('--progress-color', '#1DB954')
		volumeSlider.style.setProperty('--background-color', '#535353')

		const percent = volumeSlider.value * 100
		volumeSlider.style.setProperty('--progress-percent', `${percent}%`)

		volumeSlider.addEventListener('mousedown', function () {
			volumeSlider.style.setProperty('--slider-thumb-scale', '1.2')
		})

		volumeSlider.addEventListener('mouseup', function () {
			volumeSlider.style.setProperty('--slider-thumb-scale', '1')
		})

		volumeSlider.addEventListener('mouseleave', function () {
			volumeSlider.style.setProperty('--slider-thumb-scale', '1')
		})
	}

	// ============= Switch: "Audiofiles / Playlists" ============= //
	function setupViewSwitcher() {
		const viewSwitcher = document.querySelector('.view-switcher')
		const viewSwitchBtns = document.querySelectorAll('.view-switch-btn')

		viewSwitchBtns.forEach(btn => {
			btn.addEventListener('click', function () {
				viewSwitchBtns.forEach(b => b.classList.remove('active'))
				this.classList.add('active')

				const view = this.dataset.view
				viewSwitcher.setAttribute('data-active-view', view)

				if (view === 'tracks') {
					document.getElementById('tracks-view').style.display = 'block'
					document.getElementById('playlists-view').style.display = 'none'
				} else if (view === 'playlists') {
					document.getElementById('tracks-view').style.display = 'none'
					document.getElementById('playlists-view').style.display = 'block'
				}
			})
		})

		viewSwitcher.setAttribute('data-active-view', 'tracks')
		document
			.querySelector('.view-switch-btn[data-view="tracks"]')
			.classList.add('active')
	}

	// ============= "More details" page ============= //
	function renderAllTracks() {
		document.querySelectorAll('.genre-section').forEach(section => {
			section.classList.remove('active')
		})

		if (currentGenreFilter === 'all') {
			document.querySelectorAll('.genre-section').forEach(section => {
				section.classList.add('active')
			})
		} else {
			document
				.getElementById(`${currentGenreFilter}-section`)
				.classList.add('active')
		}

		const tracksByGenre = {
			rap: allTracks.filter(track => track.genre === 'rap'),
			rock: allTracks.filter(track => track.genre === 'rock'),
			metal: allTracks.filter(track => track.genre === 'metal'),
			other: allTracks.filter(track => track.genre === 'other'),
		}

		for (const genre in tracksByGenre) {
			const tracksList = document.getElementById(`${genre}-tracks`)
			if (!tracksList) continue

			tracksList.innerHTML = ''

			if (tracksByGenre[genre].length === 0) {
				tracksList.innerHTML = `
                <div class="notification empty">
                    <p>Нет аудиофайлов в этом жанре</p>
                </div>
            `
				continue
			}

			tracksByGenre[genre].forEach(track => {
				const trackEl = document.createElement('div')
				trackEl.className = 'track-item'

				const deleteButton = track.isCustom
					? `
                <button class="delete-btn" data-id="${track.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `
					: ''

				trackEl.innerHTML = `
                <div class="track-avatar">
                    <i class="fas fa-music"></i>
                </div>
                <div class="track-info">
                    <h4 class="track-title">${track.title}</h4>
                    <p class="track-artist">${track.artist}</p>
                </div>
                ${deleteButton}
            `

				trackEl.addEventListener('click', e => {
					if (!e.target.closest('.delete-btn')) {
						playTrackFromAll(track)
						switchPage('home')
					}
				})

				tracksList.appendChild(trackEl)
			})
		}

		setupDeleteButtons()
	}

	// ============= Delete audio file button ============= //
	function setupDeleteButtons() {
		document.querySelectorAll('.delete-btn').forEach(btn => {
			btn.addEventListener('click', function (e) {
				e.stopPropagation()
				deleteTrack(this.dataset.id)
			})
		})
	}

	// ============= Logic for deleting an audio file ============= //
	function deleteTrack(title, artist) {
		const trackToDelete = allTracks.find(
			track => track.title === title && track.artist === artist
		)
		if (trackToDelete && trackToDelete.isCustom) {
			songs = songs.filter(
				song => !(song.title === title && song.artist === artist)
			)

			allTracks = allTracks.filter(
				track => !(track.title === title && track.artist === artist)
			)

			if (songs.length > 0 && currentSongIndex >= songs.length) {
				currentSongIndex = Math.max(0, songs.length - 1)
			} else if (songs.length === 0) {
				audioPlayer.pause()
				isPlaying = false
				updatePlayButton()
			}

			renderPlaylist()
			renderAllTracks()

			if (songs.length > 0 && currentSongIndex < songs.length) {
				playSong(currentSongIndex)
			}

			showNotification('Удалено', `Аудиофайл "${title}" удален`)
		} else {
			showNotification('Ошибка', 'Этот аудиофайл нельзя удалить')
		}
	}
	// ============= I forgot what it is, but it's related to the next play ============= //
	function playTrackFromAll(track) {
		const currentTrack = allTracks.find(t => t.id === track.id)

		if (!currentTrack) {
			showNotification('Ошибка', 'Аудиофайл не найден')
			return
		}

		const songIndex = songs.findIndex(s => s.id === currentTrack.id)

		if (songIndex !== -1) {
			currentSongIndex = songIndex
			playSong(currentSongIndex)
		} else {
			songs = allTracks.filter(t => t.genre === currentTrack.genre)
			currentSongIndex = songs.findIndex(t => t.id === currentTrack.id)
			renderPlaylist()
			playSong(currentSongIndex)
		}
	}

	// ============= Genres ============= //
	function setupGenreFilters() {
		const genreBtns = document.querySelectorAll('.genre-btn')

		genreBtns.forEach(btn => {
			btn.addEventListener('click', function () {
				genreBtns.forEach(b => b.classList.remove('active'))
				this.classList.add('active')

				currentGenreFilter = this.dataset.genre

				renderAllTracks()
			})
		})
	}
	// ============= Playlists ============= //
	function renderPlaylists() {
		const playlistsList = document.getElementById('playlists-list')
		playlistsList.innerHTML = ''

		if (playlists.length === 0) {
			playlistsList.innerHTML = `
            <div class="notification empty">
                <p>У вас пока нет плейлистов</p>
            </div>
        `
			return
		}

		playlists.forEach(playlist => {
			const playlistEl = document.createElement('div')
			playlistEl.className = 'playlist-item'
			playlistEl.innerHTML = `
            <div class="playlist-item-icon">
                <i class="fas fa-list"></i>
            </div>
            <div class="playlist-item-info">
                <h4 class="playlist-item-title">${playlist.name}</h4>
                <p class="playlist-item-artist">${playlist.songs.length} аудиофайлов</p>
            </div>
            <button class="playlist-delete-btn" data-id="${playlist.id}">
                <i class="fas fa-trash"></i>
            </button>
        `

			playlistEl.addEventListener('click', e => {
				if (
					!e.target.closest('.playlist-delete-btn') &&
					!e.target.closest('.track-delete-btn')
				) {
					currentPlaylistId = playlist.id
					playPlaylist(playlist.id)
					switchPage('home')
				}
			})

			playlistsList.appendChild(playlistEl)
		})

		setupDeleteButtons()

		function deletePlaylist(playlistId) {
			const modal = document.getElementById('confirm-delete-modal')
			modal.style.display = 'flex'

			const confirmBtn = document.getElementById('confirm-delete-btn')
			const newConfirmBtn = confirmBtn.cloneNode(true)
			confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn)

			newConfirmBtn.addEventListener('click', function () {
				playlists = playlists.filter(playlist => playlist.id !== playlistId)
				localStorage.setItem('playlists', JSON.stringify(playlists))

				if (currentPlaylistId === playlistId) {
					currentPlaylistId = null
					loadSongs()
				}

				renderPlaylists()
				showNotification('Успех', 'Плейлист успешно удален')

				modal.style.display = 'none'
			})

			modal.querySelectorAll('.close-modal').forEach(btn => {
				btn.addEventListener('click', function () {
					modal.style.display = 'none'
				})
			})

			modal.addEventListener('click', function (e) {
				if (e.target === this) {
					modal.style.display = 'none'
				}
			})
		}

		document.querySelectorAll('.playlist-delete-btn').forEach(btn => {
			btn.addEventListener('click', e => {
				e.stopPropagation()
				const playlistId = btn.dataset.id
				deletePlaylist(playlistId)
			})
		})
	}

	// ============= Displaying audio files in a playlist ============= //
	function renderPlaylistTracks(playlistId) {
		const playlist = playlists.find(p => p.id === playlistId)
		if (!playlist) return

		const playlistTracksEl = document.getElementById('playlist-tracks')
		playlistTracksEl.innerHTML =
			'<h3 class="playlist-tracks-title">Аудиофайлы в плейлисте</h3>'

		if (playlist.songs.length === 0) {
			playlistTracksEl.innerHTML += `
            <div class="notification empty">
                <p>Плейлист пуст</p>
            </div>
        `
			return
		}

		playlist.songs.forEach((track, index) => {
			const trackEl = document.createElement('div')
			trackEl.className = 'playlist-track-item'

			trackEl.innerHTML = `
            <div class="playlist-track-index">${index + 1}</div>
            <div class="playlist-track-icon">
                <i class="fas fa-music"></i>
            </div>
            <div class="playlist-track-info">
                <h4 class="playlist-track-title">${track.title}</h4>
                <p class="playlist-track-artist">${track.artist}</p>
            </div>
            <div class="playlist-track-duration">${
							track.duration || '0:00'
						}</div>
            <button class="playlist-track-delete-btn" data-id="${
							track.id
						}" data-playlist-id="${playlistId}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `

			trackEl.addEventListener('click', e => {
				if (!e.target.closest('.playlist-track-delete-btn')) {
					const songIndex = songs.findIndex(s => s.id === track.id)
					if (songIndex !== -1) {
						playSong(songIndex)
					}
				}
			})

			playlistTracksEl.appendChild(trackEl)
		})

		document.querySelectorAll('.playlist-track-delete-btn').forEach(btn => {
			btn.addEventListener('click', function (e) {
				e.stopPropagation()
				deleteTrackFromPlaylist(this.dataset.id, this.dataset.playlistId)
			})
		})
	}

	// ============= Removing audio files from a playlist ============= //
	function deleteTrackFromPlaylist(trackId, playlistId) {
		const playlist = playlists.find(p => p.id === playlistId)
		if (!playlist) return

		const trackIndex = playlist.songs.findIndex(track => track.id === trackId)
		if (trackIndex === -1) return

		const trackToDelete = playlist.songs[trackIndex]
		playlist.songs.splice(trackIndex, 1)

		localStorage.setItem('playlists', JSON.stringify(playlists))

		if (currentPlaylistId === playlistId) {
			songs = [...playlist.songs]

			if (currentSongIndex >= songs.length) {
				currentSongIndex = Math.max(0, songs.length - 1)
			}

			if (trackIndex === currentSongIndex) {
				if (songs.length > 0) {
					playSong(currentSongIndex)
				} else {
					audioPlayer.pause()
					isPlaying = false
					updatePlayButton()
				}
			}
		}

		renderPlaylist()
		renderPlaylistTracks(playlistId)

		showNotification(
			'Удалено',
			`Аудиофайл "${trackToDelete.title}" удален из плейлиста`
		)
	}

	// ============= Playing playlists ============= //
	function playPlaylist(playlistId) {
		const playlist = playlists.find(p => p.id === playlistId)
		if (!playlist) return

		currentPlaylistId = playlistId
		songs = [...playlist.songs]
		currentSongIndex = 0

		songs.forEach(track => {
			if (!track.duration) track.duration = '0:00'
		})

		renderPlaylist()
		renderPlaylistTracks(playlistId)

		if (songs.length > 0) {
			playSong(0)
		}
	}

	// ============= Clearing notifications ============= //
	function clearAllNotifications() {
		const notificationList = document.getElementById('notification-list')

		if (
			notificationList.querySelectorAll('.notification:not(.empty)').length ===
			0
		) {
		}

		notificationList.innerHTML = `
        <div class="notification empty">
            <p>Новых уведомлений нет</p>
        </div>
    `
	}

	// ============= Modal window for creating a playlist ============= //
	function showCreatePlaylistModal() {
		const modal = document.getElementById('playlist-modal')
		modal.style.display = 'flex'

		const songsList = document.getElementById('playlist-songs-list')
		songsList.innerHTML = ''

		songs.forEach((song, index) => {
			const songEl = document.createElement('div')
			songEl.className = 'playlist-song-item'
			songEl.innerHTML = `
					<input type="checkbox" id="song-${index}" class="playlist-song-checkbox">
					<label for="song-${index}" class="playlist-song-label">
							<span class="playlist-song-title">${song.title}</span>
							<span class="playlist-song-artist">${song.artist}</span>
					</label>
			`
			songsList.appendChild(songEl)
		})
	}

	// ============= Create a playlist ============= //
	function createPlaylist() {
		const nameInput = document.getElementById('playlist-name')
		const playlistName = nameInput.value.trim()

		if (!playlistName) {
			showNotification('Ошибка', 'Введите название плейлиста')
			return
		}

		const checkboxes = document.querySelectorAll(
			'.playlist-song-checkbox:checked'
		)
		if (checkboxes.length === 0) {
			showNotification('Ошибка', 'Выберите хотя бы один аудиофайл')
			return
		}

		const selectedSongs = Array.from(checkboxes).map(checkbox => {
			const index = parseInt(checkbox.id.split('-')[1])
			return {
				title: songs[index].title,
				artist: songs[index].artist,
				src: songs[index].src,
			}
		})

		const newPlaylist = {
			id: Date.now().toString(),
			name: playlistName,
			songs: selectedSongs,
			createdAt: new Date().toISOString(),
		}

		playlists.push(newPlaylist)
		localStorage.setItem('playlists', JSON.stringify(playlists))

		document.getElementById('playlist-modal').style.display = 'none'
		nameInput.value = ''
		renderPlaylists()
		showNotification('Успех', 'Плейлист успешно создан')
	}

	// ============= Playlist render ============= //
	function renderPlaylist(filteredSongs = null) {
		const songsToRender = filteredSongs || songs
		playlistEl.innerHTML = ''

		if (songsToRender.length === 0) {
			playlistEl.innerHTML =
				'<div class="playlist-item empty"><p>Нет доступных аудиофайлов</p></div>'
			return
		}

		songsToRender.forEach((song, index) => {
			const songEl = document.createElement('div')
			songEl.className = `playlist-item ${
				index === currentSongIndex && songsToRender === songs ? 'active' : ''
			}`

			const deleteButton = song.isCustom
				? `
					<button class="delete-btn" data-id="${song.id}">
							<i class="fas fa-trash-alt"></i>
					</button>
			`
				: ''

			songEl.innerHTML = `
				<div class="playlist-item-icon">
						<i class="fas fa-music"></i>
				</div>
				<div class="playlist-item-info">
						<h4 class="playlist-item-title" title="${song.title}">${song.title}</h4>
						<p class="playlist-item-artist" title="${song.artist}">${song.artist}</p>
				</div>
				<div class="playlist-item-duration">${song.duration}</div>
				${deleteButton}
			`

			songEl.addEventListener('click', e => {
				if (!e.target.closest('.delete-btn')) {
					playSong(index)
				}
			})

			playlistEl.appendChild(songEl)
		})

		setupDeleteButtons()
	}

	// ============= Play audio file ============= //
	function playSong(index) {
		if (index < 0 || index >= songs.length) {
			showNotification('Ошибка', 'Аудиофайл не найден')
			return
		}

		currentSongIndex = index
		const song = songs[currentSongIndex]

		audioPlayer.src = song.src
		audioPlayer
			.play()
			.then(() => {
				isPlaying = true
				updatePlayButton()
				updateNowPlaying()
				highlightCurrentSong()
			})
			.catch(error => {
				console.error('Ошибка воспроизведения:', error)
				showNotification(
					'Ошибка воспроизведения',
					'Не удалось воспроизвести выбранный аудиофайл'
				)
			})
	}

	// ============= Play button update ============= //
	function updatePlayButton() {
		const icon = playBtn.querySelector('i')
		if (isPlaying) {
			icon.classList.replace('fa-play', 'fa-pause')
		} else {
			icon.classList.replace('fa-pause', 'fa-play')
		}
	}

	// ============= Update information about the current audio file ============= //
	function updateNowPlaying() {
		const song = songs[currentSongIndex]
		songTitleEl.textContent = song.title
		songArtistEl.textContent = song.artist
	}

	audioPlayer.addEventListener('play', () => {
		highlightCurrentSong()
	})

	// ============= Highlighting the current audio file in the playlist ============= //
	function highlightCurrentSong() {
		const items = document.querySelectorAll('.playlist-item')
		items.forEach((item, index) => {
			item.classList.remove('active')
		})

		const activeItem = Array.from(items).find(item => {
			const title = item.querySelector('.playlist-item-title').textContent
			const artist = item.querySelector('.playlist-item-artist').textContent
			return (
				songs[currentSongIndex]?.title === title &&
				songs[currentSongIndex]?.artist === artist
			)
		})

		if (activeItem) {
			activeItem.classList.add('active')
		}
	}

	playSong

	// ============= Switch to the next audio file ============= //
	function nextSong() {
		currentSongIndex = (currentSongIndex + 1) % songs.length
		playSong(currentSongIndex)
	}

	// ============= Switch to the previous audio file ============= //
	function prevSong() {
		currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length
		playSong(currentSongIndex)
	}

	// ============= Search for audio files ============= //
	function searchSongs(query) {
		if (!query.trim()) {
			renderPlaylist()
			return
		}

		const lowerQuery = query.toLowerCase()
		const results = songs.filter(
			song =>
				song.title.toLowerCase().includes(lowerQuery) ||
				song.artist.toLowerCase().includes(lowerQuery)
		)

		renderPlaylist(results)

		if (searchResults) {
			searchResults.innerHTML = ''

			if (results.length === 0) {
				searchResults.innerHTML =
					'<div class="notification empty"><p>Ничего не найдено</p></div>'
				return
			}

			results.forEach((song, index) => {
				const resultEl = document.createElement('div')
				resultEl.className = 'notification'
				resultEl.innerHTML = `
								<div class="notification-icon">
										<i class="fas fa-music"></i>
								</div>
								<div class="notification-content">
										<h4>${song.title}</h4>
										<p>${song.artist} • ${song.duration}</p>
								</div>
						`

				resultEl.addEventListener('click', () => {
					playSong(
						songs.findIndex(
							s => s.title === song.title && s.artist === song.artist
						)
					)
					switchPage('home')
				})
				searchResults.appendChild(resultEl)
			})
		}
	}

	// ============= Downloading audio files ============= //
	function handleFileUpload(files) {
		const genreModal = document.getElementById('genre-modal')

		genreModal.style.display = 'flex'

		document.getElementById('cancel-genre').addEventListener('click', () => {
			genreModal.style.display = 'none'
			uploadStatus.textContent = 'Загрузка отменена'
			uploadStatus.style.color = '#ff4d4d'
		})

		document.getElementById('confirm-genre').addEventListener('click', () => {
			const genre = document.getElementById('genre-select').value
			genreModal.style.display = 'none'
			processUploadedFiles(files, genre)
		})
	}

	// ============= Processing uploaded audio files ============= //
	async function processUploadedFiles(files, genre) {
		uploadStatus.textContent = `Обработка ${files.length} аудиофайл(ов)...`
		uploadStatus.style.color = 'var(--primary-color)'

		for (const file of files) {
			try {
				const { title, artist, duration } = await parseAudioFile(file)
				const fileUrl = URL.createObjectURL(file)

				const newSong = {
					id: 'custom_' + Date.now() + Math.random().toString(36).substr(2, 9),
					title: title,
					artist: artist || 'Неизвестный исполнитель',
					src: fileUrl,
					duration: formatDuration(duration) || '0:00',
					genre: genre,
					isCustom: true,
				}

				allTracks.push(newSong)

				if (currentGenreFilter === 'all' || currentGenreFilter === genre) {
					songs.push(newSong)
				}
			} catch (error) {
				console.error('Ошибка обработки аудиофайла:', file.name, error)
			}
		}

		renderPlaylist()
		renderAllTracks()
		showNotification(
			'Аудиофайлы загружены',
			`Успешно обработано ${files.length} аудиофайл(ов)`
		)
	}

	// ============= Deleting an audio file ============= //
	function deleteTrack(trackId, playlistId = null) {
		const trackIndex = allTracks.findIndex(track => track.id === trackId)

		if (trackIndex === -1) {
			return
		}

		const trackToDelete = allTracks[trackIndex]

		if (!trackToDelete.isCustom && !playlistId) {
			showNotification('Ошибка', 'Этот аудиофайл нельзя удалить')
			return
		}

		if (playlistId) {
			const playlist = playlists.find(p => p.id === playlistId)

			if (playlist) {
				const trackInPlaylistIndex = playlist.songs.findIndex(
					song => song.id === trackId
				)

				if (trackInPlaylistIndex !== -1) {
					playlist.songs.splice(trackInPlaylistIndex, 1)
					localStorage.setItem('playlists', JSON.stringify(playlists))

					if (currentPlaylistId === playlistId) {
						songs = [...playlist.songs]
						if (currentSongIndex >= songs.length) {
							currentSongIndex = Math.max(0, songs.length - 1)
						}

						if (songs.length === 0) {
							audioPlayer.pause()
							isPlaying = false
							updatePlayButton()
						}
					}
				}
			}
		} else {
			allTracks.splice(trackIndex, 1)

			const currentPlaylistIndex = songs.findIndex(song => song.id === trackId)
			if (currentPlaylistIndex !== -1) {
				songs.splice(currentPlaylistIndex, 1)

				if (currentSongIndex >= songs.length) {
					currentSongIndex = Math.max(0, songs.length - 1)
				}

				if (currentPlaylistIndex === currentSongIndex) {
					if (songs.length > 0) {
						playSong(currentSongIndex)
					} else {
						audioPlayer.pause()
						isPlaying = false
						updatePlayButton()
					}
				}
			}
		}

		updateAllSections()
		showNotification('Удалено', `Аудиофайл "${trackToDelete.title}" удален`)
	}

	// ============= Updating all sections ============= //
	function updateAllSections() {
		renderPlaylist()
		renderAllTracks()

		if (document.getElementById('playlists-view').style.display !== 'none') {
			renderPlaylists()
		}
	}

	// ============= Audio file analysis ============= //
	function parseAudioFile(file) {
		return new Promise((resolve, reject) => {
			new jsmediatags.Reader(file).setTagsToRead(['title', 'artist']).read({
				onSuccess: tags => {
					const audio = new Audio()
					audio.preload = 'metadata'

					audio.onloadedmetadata = () => {
						const title = (
							tags.tags.title || file.name.replace(/\.[^/.]+$/, '')
						).substring(0, 50)

						resolve({
							title: title,
							artist: (tags.tags.artist || 'Неизвестный исполнитель').substring(
								0,
								30
							),
							duration: audio.duration,
						})
						URL.revokeObjectURL(audio.src)
					}

					audio.onerror = () => {
						resolve({
							title: file.name.replace(/\.[^/.]+$/, ''),
							artist: 'Неизвестный исполнитель',
							duration: 0,
						})
					}

					audio.src = URL.createObjectURL(file)
				},
				onError: () => {
					const audio = new Audio()
					audio.preload = 'metadata'

					audio.onloadedmetadata = () => {
						resolve({
							title: file.name.replace(/\.[^/.]+$/, ''),
							artist: 'Неизвестный исполнитель',
							duration: audio.duration,
						})
						URL.revokeObjectURL(audio.src)
					}

					audio.onerror = () => {
						resolve({
							title: file.name.replace(/\.[^/.]+$/, ''),
							artist: 'Неизвестный исполнитель',
							duration: 0,
						})
					}
					audio.src = URL.createObjectURL(file)
				},
			})
		})
	}

	// ============= Duration formatting ============= //
	function formatDuration(seconds) {
		if (isNaN(seconds)) return '0:00'

		const minutes = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
	}

	// ============= Getting the name of the genre ============= //
	function getGenreName(genreKey) {
		const genres = {
			rap: 'Рэп',
			rock: 'Рок',
			metal: 'Метал',
			other: 'Остальное',
		}
		return genres[genreKey] || genreKey
	}

	// ============= Notifications ============= //
	function showNotification(title, message) {
		const popupNotification = document.createElement('div')
		popupNotification.className = 'top-notification'
		popupNotification.innerHTML = `
			<div class="notification-icon">
					<i class="fas fa-check-circle"></i>
			</div>
			<div class="notification-content">
					<h4>${title}</h4>
					<p>${message}</p>
			</div>
	`

		popupNotification.addEventListener('click', () => {
			switchPage('notifications')
			hideNotification(popupNotification)
		})

		document.body.appendChild(popupNotification)
		setTimeout(() => popupNotification.classList.add('show'), 10)

		setupAutoClose(popupNotification)

		addToNotificationList(title, message)
	}

	// ============= Hide notification ============= //
	function hideNotification(notification) {
		notification.classList.remove('show')
		setTimeout(() => notification.remove(), 300)
	}

	// ============= Additional for notifications ============= //
	function setupAutoClose(notification) {
		let autoCloseTimer = setTimeout(() => hideNotification(notification), 3000)

		notification.addEventListener('mouseenter', () => {
			clearTimeout(autoCloseTimer)
			notification.style.backgroundColor = 'var(--dark-tertiary)'
		})

		notification.addEventListener('mouseleave', () => {
			notification.style.backgroundColor = 'var(--dark-secondary)'
			autoCloseTimer = setTimeout(() => hideNotification(notification), 3000)
		})
	}

	// ============= Adding a notification to the notifications section ============= //
	function addToNotificationList(title, message) {
		const notificationList = document.getElementById('notification-list')
		const emptyNotification = notificationList.querySelector('.empty')

		if (emptyNotification) notificationList.removeChild(emptyNotification)

		const listNotification = document.createElement('div')
		listNotification.className = 'notification'
		listNotification.innerHTML = `
			<div class="notification-icon">
					<i class="fas fa-check-circle"></i>
			</div>
			<div class="notification-content">
					<h4>${title}</h4>
					<p>${message}</p>
			</div>
	`
		notificationList.insertBefore(listNotification, notificationList.firstChild)
	}

	// ============= Page Switcher "Bottom Panel" ============= //
	function switchPage(pageId) {
		pages.forEach(page => {
			if (page.id === pageId) {
				page.classList.add('active')

				if (pageId === 'more') {
					renderAllTracks()
				}
			} else {
				page.classList.remove('active')
			}
		})

		navBtns.forEach(btn => {
			if (btn.dataset.page === pageId) {
				btn.classList.add('active')
			} else {
				btn.classList.remove('active')
			}
		})
	}

	// ============= Page swiping system ============= //
	function setupSwipeNavigation() {
		const pagesOrder = ['home', 'search', 'add', 'more', 'notifications']
		let startX = 0
		let endX = 0
		const threshold = 50
		let isSwiping = false

		const getCurrentPageIndex = () => {
			const activePage = document.querySelector('.page.active')
			return activePage ? pagesOrder.indexOf(activePage.id) : 0
		}

		document.addEventListener(
			'touchstart',
			e => {
				startX = e.touches[0].clientX
				isSwiping = false
			},
			{ passive: true }
		)

		document.addEventListener(
			'touchmove',
			e => {
				if (Math.abs(e.touches[0].clientX - startX) > 10) {
					isSwiping = true
				}
				endX = e.touches[0].clientX
			},
			{ passive: true }
		)

		document.addEventListener(
			'touchend',
			() => {
				if (!isSwiping) return

				const diffX = endX - startX
				const currentPageIndex = getCurrentPageIndex()

				if (diffX < -threshold && currentPageIndex < pagesOrder.length - 1) {
					switchPage(pagesOrder[currentPageIndex + 1])
				} else if (diffX > threshold && currentPageIndex > 0) {
					switchPage(pagesOrder[currentPageIndex - 1])
				}
			},
			{ passive: true }
		)
	}

	// ============= Launching the application ============= //
	init()
})
