(function($) {

var parser, serializer;

Mavo.Plugins.register("tinymce", {
	ready: $.include(self.tinymce, "https://cdn.tinymce.com/4/tinymce.min.js").then(() => {
		parser = new tinymce.html.DomParser();
		serializer = new tinymce.html.Serializer();
	})
});

Mavo.Elements.register(".tinymce", {
	hasChildren: true,
	default: true,
	edit: function() {
		this.preEdit.then(evt => {
			if (this.element.tinymce) {
				// Previously edited, we already have an editor
				tinymce.EditorManager.execCommand("mceAddEditor", true, this.element.tinymce.id);
				return;
			}

			// Init for the first time
			tinymce.init({
				target: this.element,
				inline: true,
				menubar: false,
				toolbar: "bold italic | bullist numlist",
				plugins: "paste lists tabfocus",
				invalid_styles: "color background font-size font-weight font-family font-style font", // https://medium.com/@martin.sikora/how-to-make-tinymce-to-output-clean-html-b4854daeb286
				invalid_elements: "span,h1,h2,h3,h4,h5,h6",
				language: "ru"
			}).then(editors => {
				this.element.tinymce = editors[0];

				this.element.tinymce.on("change keyup paste cut", evt => {
					this.value = this.getValue();
				});
			});
		});
	},
	done: function() {
		if (this.tinymce) {
			tinymce.EditorManager.execCommand("mceRemoveEditor", true, this.tinymce.id);
		}
	},
	getValue: (element) => {
		return element.tinymce ? element.tinymce.getContent() : element.innerHTML;
	},
	setValue: (element, value) => {
		const content = serializer.serialize(parser.parse(value));
		
		if (!element.tinymce) {
			element.innerHTML = content;
		}
		else if (element.tinymce.isHidden()) {
			element.tinymce.setContent(content);
		}
	}
});

})(Bliss);
