<template>
	<div class="video-capture">
		<div class="video-and-image">
			<div class="video-container">
				<video ref="video" :src="videoUrl" crossorigin="anonymous" controls loop
					@canplay="onVideoCanPlay"></video>
			</div>
			<div class="image-container">
				<img :src="capturedImage" alt="Captured Frame" v-if="capturedImage" />
				<div v-if="capturedImage">
					<input v-model="imageTag" placeholder="Enter a tag or remark" />
					<button @click="uploadImage">Upload Image</button>
				</div>
			</div>
		</div>
		<button @click="startVideo" :disabled="videoStarted">Start Video</button>
		<button @click="captureFrame">Capture Frame</button>
		<canvas ref="canvas" style="display: none;"></canvas>
	</div>
</template>

<script>
export default {
	name: 'VideoCapture',
	props: {
		videoUrl: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			capturedImage: null,
			imageTag: '',
			videoStarted: false, // Track if the video has started
			videoPaused: false // Track if the video is paused
		};
	},
	methods: {
		onVideoCanPlay() {
			this.$refs.video.width = this.$refs.video.videoWidth;
			this.$refs.video.height = this.$refs.video.videoHeight;
			this.$refs.canvas.width = this.$refs.video.videoWidth;
			this.$refs.canvas.height = this.$refs.video.videoHeight;
		},
		startVideo() {
			this.$refs.video.play()
				.then(() => {
					this.videoStarted = true; // Set videoStarted to true when the video starts
				})
				.catch(error => {
					console.error('Error trying to play video:', error);
				});
		},
		captureFrame() {
			const video = this.$refs.video;
			const canvas = this.$refs.canvas;
			const context = canvas.getContext('2d');

			// Pause the video
			video.pause();
			this.videoPaused = true;

			// Draw the current frame of the video onto the canvas
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Get the image data URL from the canvas
			this.capturedImage = canvas.toDataURL('image/png');
		},
		async uploadImage() {
			const base64Data = this.capturedImage.split(',')[1];
			const blob = this.b64toBlob(base64Data, 'image/png');

			const formData = new FormData();
			formData.append('image', blob, 'capture.png');
			formData.append('tag', this.imageTag);

			try {
				const response = await fetch('http://localhost:3000/upload', {
					method: 'POST',
					body: formData
				});

				const result = await response.json();
				console.log(result);

				// Clear the captured image and tag after successful upload
				this.capturedImage = null;
				this.imageTag = '';

				// Resume the video if it was paused
				if (this.videoPaused) {
					this.$refs.video.play()
						.then(() => {
							this.videoPaused = false; // Reset the paused state
						})
						.catch(error => {
							console.error('Error trying to resume video:', error);
						});
				}
			} catch (error) {
				console.error('Error uploading image:', error);
			}
		},
		b64toBlob(b64Data, contentType = '', sliceSize = 512) {
			const byteCharacters = atob(b64Data);
			const byteArrays = [];

			for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				const slice = byteCharacters.slice(offset, offset + sliceSize);

				const byteNumbers = new Array(slice.length);
				for (let i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				const byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}

			return new Blob(byteArrays, { type: contentType });
		}
	}
};
</script>

<style scoped>
.video-capture {
	width: 100%;
	max-width: 1200px;
	/* Increased max-width */
	margin: auto;
	text-align: center;
}

.video-and-image {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.video-container,
.image-container {
	flex: 1;
	/* Allow both containers to grow equally */
	margin: 10px;
}

video {
	width: 100%;
	/* Make the video take up full container width */
	height: auto;
}

.image-container {
	text-align: center;
}

canvas {
	display: none;
}

img {
	max-width: 100%;
	/* Ensure the image takes up full container width */
	margin-top: 10px;
}

input {
	display: block;
	margin: 10px auto;
}

button {
	display: block;
	margin: 10px auto;
}
</style>
