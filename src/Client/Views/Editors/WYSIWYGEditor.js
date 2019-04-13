/**
 * A standalone WYSIWYG editor
 *
 * @memberof HashBrown.Client.Views.Editors
 */
class WYSIWYGEditor extends Crisp.View {
    constructor(params) {
        super(params);

        this.fetch();
    }

    /**
     * Event: Value changed
     */
    onChange() {
        this.value = this.toValue(this.$editor.html());

        this.trigger('change', this.value);
    }

    /**
     * Insert HTML
     *
     * @param {String} html
     */
    insertHtml(html) {
        if(!html) { return; }

        this.$editor[0].innerHTML += this.toView(html);

        this.onChange();
    };

    /**
     * Updates the paragraph picker and selection tag
     */
    updateElementTag () {
        let selection = window.getSelection();

        if(!selection) { return; }

        let textNode = selection.anchorNode;

        if(!textNode) { return; }
        
        let parentElement = textNode.parentElement;
       
        if(!parentElement) { return; }
        
        let parentElementTagName = parentElement.tagName.toLowerCase();

        // If a media objects is involved, use it as reference
        if(textNode.children) {
            for(let i = 0; i < textNode.children.length; i++) {
                if(textNode.children[i].hasAttribute('src')) {
                    parentElementTagName = textNode.children[i].parentElement.tagName.toLowerCase();
                    break;
                }
            }
        }

        // If the parent tag is not a heading or a paragraph, default to paragraph
        if(!this.paragraphPicker.options[parentElementTagName]) {
            parentElementTagName = 'p';
        }

        this.paragraphPicker.setValueSilently(parentElementTagName);
    }

    /**
     * Converts HTML to view format, replacing media references
     *
     * @param {String} html
     *
     * @return {String} HTML
     */
    toView(html) {
        this._parserCache = {};
        
        if(!html) { return ''; }

        return html.replace(/src=".*media\/([a-z0-9]+)\/([^"]+)"/g, (original, id, filename) => {
            this._parserCache[id] = filename;
        
            return 'src="/media/' + HashBrown.Context.projectId + '/' + HashBrown.Context.environment + '/' + id + '"';
        });
    }

    /**
     * Converts HTML to value format, replacing media references
     *
     * @param {String} html
     *
     * @return {String} HTML
     */
    toValue(html) {
        if(!html) { return ''; }
        
        // Replace media references
        html = html.replace(new RegExp('src="/media/' + HashBrown.Context.projectId + '/' + HashBrown.Context.environment + '/([a-z0-9]+)"', 'g'), (original, id) => {
            let filename = this._parserCache ? this._parserCache[id] : null;

            if(!filename) { return original; }
        
            return 'src="/media/' + id + '/' + filename + '"';
        });

        // Replace empty divs with pararaphs
        html = html.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');

        return html;
    }

    /**
     * Event: Change heading
     */
    onChangeHeading(newValue) {
        document.execCommand('heading', false, newValue);
        this.$editor.focus();
        this.onChange();
    }

    /**
     * Event: On change style
     */
    onChangeStyle(newValue) {
        document.execCommand(newValue);
        this.onChange();
    }

    /**
     * Event: On remove format
     */
    onRemoveFormat() {
        document.execCommand('removeFormat');
        document.execCommand('unlink');
        this.onChange();
    }

    /**
     * Event: Create link
     */
    onCreateLink() {
        let selection = window.getSelection();
        let anchorOffset = selection.anchorOffset;
        let focusOffset = selection.focusOffset;
        let anchorNode = selection.anchorNode;
        let url = anchorNode.parentElement.getAttribute('href');
        let range = selection.getRangeAt(0);
        let text = selection.toString();
        let newTab = false;

        if(Math.abs(anchorOffset - focusOffset) < 1) {
            return UI.messageModal('Create link', 'Please select some text first');
        }

        let modal = UI.messageModal(
            'Create link for selection "' + text + '"',
            _.div({class: 'widget-group'},
                _.div({class: 'widget widget--label'}, 'URL'),
                new HashBrown.Views.Widgets.Input({
                    type: 'text',
                    value: url,
                    onChange: (newValue) => { url = newValue; }
                }),
                new HashBrown.Views.Widgets.Input({
                    type: 'checkbox',
                    placeholder: 'New tab',
                    onChange: (newValue) => { newTab = newValue; }
                })
            ),
            () => {
                if(!url) { return; }

                selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                document.execCommand('createLink', false, url);

                setTimeout(() => {
                    let a = selection.anchorNode.parentElement.querySelector('a');

                    if(!a) { return; }

                    if(newTab) {
                        a.setAttribute('target', '_blank');
                    } else {
                        a.removeAttribute('target');
                    }

                    this.onChange();
                }, 10);
            }
        );

        modal.$element.find('input:first-of-type').focus();
    }

    /**
     * Renders this view
     */
    template() {
        return _.div({class: 'editor editor--wysiwyg'},
            this.$toolbar = _.div({class: 'editor--wysiwyg__toolbar widget-group'},
                this.paragraphPicker = new HashBrown.Views.Widgets.Dropdown({
                    value: 'p',
                    options: {
                        p: 'Paragraph',
                        h1: 'Heading 1',
                        h2: 'Heading 2',
                        h3: 'Heading 3',
                        h4: 'Heading 4',
                        h5: 'Heading 5',
                        h6: 'Heading 6'
                    },
                    onChange: (newValue) => { this.onChangeHeading(newValue); }
                }),
                _.div({class: 'widget-group__separator line'}),
                _.button({class: 'widget widget--button standard small fa fa-bold', title: 'Bold'})
                    .click(() => { this.onChangeStyle('bold'); }),
                _.button({class: 'widget widget--button standard small fa fa-italic', title: 'Italic'})
                    .click(() => { this.onChangeStyle('italic'); }),
                _.button({class: 'widget widget--button standard small fa fa-underline', title: 'Underline'})
                    .click(() => { this.onChangeStyle('underline'); }),
                _.div({class: 'widget-group__separator line'}),
                _.button({class: 'widget widget--button standard small fa fa-list-ol', title: 'Ordered list'})
                    .click(() => { this.onChangeStyle('insertOrderedList'); }),
                _.button({class: 'widget widget--button standard small fa fa-list-ul', title: 'Unordered list'})
                    .click(() => { this.onChangeStyle('insertUnorderedList'); }),
                _.div({class: 'widget-group__separator line'}),
                _.button({class: 'widget widget--button standard small fa fa-indent', title: 'Indent'})
                    .click(() => { this.onChangeStyle('indent'); }),
                _.button({class: 'widget widget--button standard small fa fa-outdent', title: 'Outdent'})
                    .click(() => { this.onChangeStyle('outdent'); }),
                _.button({class: 'widget widget--button standard small fa fa-align-left', title: 'Left'})
                    .click(() => { this.onChangeStyle('justifyLeft'); }),
                _.button({class: 'widget widget--button standard small fa fa-align-center', title: 'Center'})
                    .click(() => { this.onChangeStyle('justifyCenter'); }),
                _.button({class: 'widget widget--button standard small fa fa-align-justify', title: 'Justify'})
                    .click(() => { this.onChangeStyle('justifyFull'); }),
                _.button({class: 'widget widget--button standard small fa fa-align-right', title: 'Right'})
                    .click(() => { this.onChangeStyle('justifyRight'); }),
                _.div({class: 'widget-group__separator line'}),
                _.button({class: 'widget widget--button standard small fa fa-link', title: 'Create link'})
                    .click(() => { this.onCreateLink(); }),
                _.div({class: 'widget-group__separator line'}),
                _.button({class: 'widget widget--button standard small fa fa-remove', title: 'Remove formatting'})
                    .click(() => { this.onRemoveFormat(); })
            ),
            this.$editor = _.div({class: 'editor--wysiwyg__editor', contenteditable: true}, this.toView(this.value))
                .on('input', (e) => { this.onChange(); })
                .on('click', (e) => { this.updateElementTag(); })
                .on('keyup', (e) => { this.updateElementTag(); })
        )
    }
}

module.exports = WYSIWYGEditor;