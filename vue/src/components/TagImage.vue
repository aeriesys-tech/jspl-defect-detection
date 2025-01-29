<template>
	<div class="container" style="margin-top:-50px">
		<div class="row">
			<div class="col-sm-12 mb-1">
				<h3 class="text-center">AKXA smartVIEW</h3>
			</div>
			<div class="col-sm-2 mb-2 text-left">
				<button class="btn btn-primary">Defect Detection</button>
			</div>
			<div class="col-sm-6 mb-2 text-right">
				<input class="form-control" v-model="thickness" placeholder="Standard Size">
			</div>
			<div class="col-sm-2 mb-2 text-right">
				<button class="btn btn-primary" @click="calculateWidth()">Check Width</button>
			</div>
			<div class="col-sm-2 mb-2 text-right">
				<button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#previewModel"
					@click="fetchLatestImage()">Preview</button>
			</div>

		</div>

		<div v-if="image">
			<div class="row">
				<div class="col-12 mb-2 text-center">
					<div style="background-color:red;border-radius:20px">
						<h4 class="text-warning pt-2">Click on image to zoom</h4>
						<img :src="`http://172.17.33.103:3000/images/${image}`" :alt="image" class="img-thumbnail"
							@click="showLightbox = true" />
						<h4 class="pb-2 pt-2 text-warning">{{ image }}</h4>
					</div>
				</div>
				<div class="col-6 col-md-3">
					<div class="mb-3">
						<input v-model="dateTime" type="datetime-local" class="form-control" placeholder="Date Time"
							readonly />
					</div>
				</div>
				<div class="col-6 col-md-3">
					<div class="mb-3">
						<input v-model="batchNo" class="form-control" placeholder="Enter Batch No" ref="batchInput" />
					</div>
				</div>
				<div class="col-6 col-md-3">
					<div class="mb-3">
						<select v-model="feedback" class="form-select">
							<option disabled value="">Select Defect Feedback</option>
							<option>Ok</option>
							<option>Not Ok</option>
						</select>
					</div>
				</div>
				<div class="col-6 col-md-3">
					<div class="mb-3">
						<select v-model="type" class="form-select">
							<option disabled value="">Select Type</option>
							<option v-if="feedback == 'Ok'">Pit Scale</option>
							<option v-if="feedback == 'Ok'">Roll in Metal</option>
							<option v-if="feedback == 'Ok'">Edge Defect</option>
							<option v-if="feedback == 'Ok'">Edge Crack</option>
							<option v-if="feedback == 'Ok'">Longitude Crack</option>
							<option v-if="feedback == 'Ok'">Coil Mark</option>
							<option v-if="feedback == 'Ok'">Silver</option>
							<option v-if="feedback == 'Ok'">Others</option>
						</select>
					</div>
				</div>
				<div class="col-6 col-md-3">
					<div class="mb-3">
						<select v-model="severity" class="form-select">
							<option disabled value="">Select Severity</option>
							<option v-if="feedback == 'Ok'">Low</option>
							<option v-if="feedback == 'Ok'">Medium</option>
							<option v-if="feedback == 'Ok'">High</option>
							<option v-if="feedback == 'Not Ok'">Not a Defect</option>
							<option v-if="feedback == 'Not Ok'">Wrong Location</option>
							<option v-if="feedback == 'Not Ok'">Wrong Defect</option>
							<option v-if="feedback == 'Not Ok'">Oil Mark</option>
							<option v-if="feedback == 'Not Ok'">Paint Mark</option>
						</select>
					</div>
				</div>
				<div class="col-6 col-md-9">
					<div class="mb-3">
						<input type="text" v-model="remark" class="form-control" placeholder="Enter Remark">
					</div>
				</div>
				<div class="col-12 text-center">
					<button @click="tagImage" class="btn btn-primary">Tag and Move Image</button>
				</div>
			</div>
		</div>
		<div style="background-color:gray;border-radius:20px" v-else class="text-center">
			<p style="padding:200px;color:white;font-size:40px">No images available</p>
		</div>
		<div class="row">
			<div class="col-12 text-center mt-3">
				<a target="_blank" href="http://172.17.33.103:3000/api/download-excel"
					class="btn btn-secondary">Download
					Excel</a>
			</div>
		</div>
		<vue-easy-lightbox :visible="showLightbox" :imgs="[`http://172.17.33.103:3000/images/${image}`]"
			@hide="showLightbox = false" />
	</div>

	<div class="modal fade" id="previewModel" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
		aria-labelledby="previewModelLabel" aria-hidden="true">
		<div class="modal-dialog modal-fullscreen">
			<div class="modal-content">
				<div class="modal-header">
					<h1 class="modal-title fs-5" id="previewModelLabel">Preview</h1>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div
						:style="{ backgroundColor: imageSchedule && imageSchedule.includes('DEFECT') ? 'red' : 'transparent', borderRadius: '20px', width: '100%', height: '100%' }">
						<img :src="`http://172.17.33.103:3000/images/${imageSchedule}`" :alt="imageSchedule"
							class="img-thumbnail" />
						<h4 class="pb-2 pt-2 text-warning">{{ imageSchedule }}</h4>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>


<script>
import axios from 'axios';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useToast } from "vue-toastification";
import VueEasyLightbox from 'vue-easy-lightbox';
import { io } from "socket.io-client";

export default {
	components: {
		VueEasyLightbox
	},
	setup() {
		const image = ref(null);
		const toast = useToast();
		const showLightbox = ref(false);

		const getIndianTime = () => {
			let now = new Date();
			// Convert to IST by adding 5 hours and 30 minutes
			let istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
			let istTime = new Date(now.getTime() + istOffset);
			return istTime.toISOString().slice(0, 19).replace('T', ' ');
		};

		const dateTime = ref(getIndianTime());
		const batchNo = ref('');
		const feedback = ref('');
		const severity = ref('');
		const type = ref('');
		const remark = ref('');
		const batchInput = ref(null);
		const length = ref('');
		const thickness = ref('');
		const updateDateTime = () => {
			dateTime.value = getIndianTime();
		};
		const imageFetchInterval = ref(null);

		const imageSchedule = ref(null);

		const fetchNextImage = () => {
			axios.get('http://172.17.33.103:3000/api/next-image')
				.then((response) => {
					image.value = response.data;
					if (image.value) {
						nextTick(() => {
							batchInput.value.focus(); // Set focus to the batch input field
						});
						if (imageFetchInterval.value) {
							clearInterval(imageFetchInterval.value); // Clear the interval
							imageFetchInterval.value = null; // Reset the interval ID
						}
					} else if (!imageFetchInterval.value) {
						imageFetchInterval.value = setInterval(fetchNextImage, 60000); // Set interval if no image
					}
				})
				.catch((error) => {
					console.error('Failed to load next image:', error);
				});
		};

		const tagImage = () => {
			if (!feedback.value) {
				alert('Please select feedback');
				return;
			}
			if (feedback.value == "Ok" && !type.value) {
				alert('Please select type');
				return;
			}
			if (!severity.value) {
				alert('Please select severity');
				return;
			}
			const payload = {
				image: image.value,
				dateTime: dateTime.value,
				batchNo: batchNo.value,
				feedback: feedback.value,
				severity: severity.value,
				type: type.value,
				remark: remark.value,
			};
			axios.post('http://172.17.33.103:3000/api/tag-image', payload)
				.then(() => {
					batchNo.value = '';
					feedback.value = '';
					severity.value = '';
					type.value = '';
					remark.value = '';
					toast.success("Image tagged and moved successfully", {
						timeout: 4000
					});
					fetchNextImage();
				})
				.catch((error) => {
					console.error('Failed to tag and move image:', error);
				});
		};

		const calculateWidth = () => {
			if (!thickness.value) {
				alert('Standard size is required');
				return;
			}
			const payload = {
				thickness: thickness.value
			};
			axios.post('http://172.17.33.103:3000/api/calculateWidth', payload)
				.then(() => {
					// toast.success("Width calculation function started successfully", {
					//   timeout: 4000
					// });
				})
				.catch((error) => {
					console.error('error:', error);
				});
		};

		const calculateLength = () => {
			if (!thickness.value) {
				alert('Standard size is required');
				return;
			}
			const payload = {
				thickness: thickness.value
			};
			axios.post('http://172.17.33.103:3000/api/calculateLength', payload)
				.then((response) => {
					length.value = response.data.data;
					// toast.success("Length calculation completed successfully", {
					//   timeout: 4000
					// });
				})
				.catch((error) => {
					console.error('Failed to tag and move image:', error);
				});
		};

		const fetchLatestImage = () => {
			axios.get('http://172.17.33.103:3000/api/next-image')
				.then((response) => {
					imageSchedule.value = response.data;
				})
				.catch((error) => {
					console.error('Failed to load next image:', error);
				});
		};

		const toggleZoom = () => {
			showLightbox.value = !showLightbox.value;
		};

		onMounted(() => {
			fetchNextImage();
			setInterval(updateDateTime, 1000);
			const socket = io("http://172.17.33.103:3000");
			socket.on("new-image-detected", (data) => {
				console.log(data);
				imageSchedule.value = data.filename;
			});
		});

		onUnmounted(() => {
			if (imageFetchInterval.value) {
				clearInterval(imageFetchInterval.value);
			}
		});

		return {
			image,
			dateTime,
			batchNo,
			feedback,
			severity,
			type,
			remark,
			length,
			batchInput,
			fetchNextImage,
			tagImage,
			calculateWidth,
			calculateLength,
			showLightbox,
			thickness,
			imageSchedule,
			fetchLatestImage
		};
	},
};
</script>



<style scoped>
.img-thumbnail {
	max-width: 50%;
}
</style>
