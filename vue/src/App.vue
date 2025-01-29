<template>
	<div id="app">
		<TagImage />
	</div>
</template>

<script>
import TagImage from './components/TagImage.vue';

export default {
	name: 'App',
	components: {
		TagImage,
	},
};
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}
</style>
