<template>
  <div class="pdf-container"></div>
</template>

<script>
import PSPDFKit from "pspdfkit";

/**
 * PSPDFKit for Web example component.
 */
export default {
  name: 'PSPDFKit',
  /**
	 * The component receives `pdfFile` as a prop, which is type of `String` and is required.
	 */
  props: {
    pdfFile: {
      type: String,
      required: true,
    },
  },
  /**
	* We wait until the template has been rendered to load the document into the library.
	*/
  mounted() {
    this.loadPSPDFKit().then(async (instance) => {
      const searchQuery = "Company Ltd."; // The text to search for.
      const bbox = (await instance.search(searchQuery))
        .first()
        .rectsOnPage.get(0);

      // Create a free text annotation.
      const textAnnotation = new PSPDFKit.Annotations.TextAnnotation({
        boundingBox: bbox, // Set the bounding box of the text annotation.
        fontSize: 10,
        text: "oussama LTD", // The text to overlay.
        pageIndex: 0, // The page index to overlay the text on.
        backgroundColor: PSPDFKit.Color.WHITE
      });
      // Add the annotations to the document.
      await instance.create(textAnnotation);
      this.$emit("loaded", instance);
    });
  },
  /**
	 * We watch for `pdfFile` prop changes and trigger unloading and loading when there's a new document to load.
	 */
  watch: {
    pdfFile(val) {
      if (val) {
        this.loadPSPDFKit();
      }
    },
  },
  /**
	 * Our component has the `loadPSPDFKit` method. This unloads and cleans up the component and triggers document loading.
	 */
  methods: {
    async loadPSPDFKit() {
      PSPDFKit.unload(".pdf-container");
      return PSPDFKit.load({
        // access the pdfFile from props
        document: this.pdfFile,
        container: ".pdf-container",
      });
    },
  },

  /**
	 * Clean up when the component is unmounted so it's ready to load another document (not needed in this example).
	 */
  beforeUnmount() {
    PSPDFKit.unload(".pdf-container");
  },
};
</script>


<style scoped>
.pdf-container {
  height: 100vh;
}
</style>