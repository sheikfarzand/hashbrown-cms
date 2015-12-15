'use strict';

class ContextMenu extends View {
    constructor(args) {
        super(args);

        // Recycle other context menus
        if($('.context-menu').length > 0) {
            this.$element = $('.context-menu');
        } else {
            this.$element = _.ul({ class: 'context-menu dropdown-menu', role: 'menu' });
        }

        this.$element.css({
            position: 'absolute',
            'z-index': 1200,
            top: this.pos.y,
            left: this.pos.x,
            display: 'block'
        });
        
        this.fetch();
    }
    
    render() {
        var view = this;

        view.$element.html(
            _.each(
                view.model,
                function(label, func) {
                    if(func == '---') {
                        return _.li(
                            { class: 'dropdown-header' },
                            label
                        );
                    } else {
                        return _.li(
                            { class: typeof func === 'function' ? '' : 'disabled' },
                            _.a(
                                { tabindex: '-1', href: '#' },
                                label
                            ).click(function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                if(func) {
                                    func(e);

                                    view.remove();
                                }
                            })
                        );
                    }
                }
            )
        );

        $('body').append(view.$element);
    }    
}

// jQuery extention
jQuery.fn.extend({
    context: function(menuItems) {
        return this.each(function() {
            $(this).on('contextmenu', function(e) {
                if(e.ctrlKey) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                if(e.which == 3) {
                    var menu = new ContextMenu({
                        model: menuItems,
                        pos: {
                            x: e.pageX,
                            y: e.pageY
                        }
                    });
                }
            });
        });
    }
});

// Event handling
$('body').click(function(e) {
    if($(e.target).parents('.context-menu').length < 1) {
        ViewHelper.removeAll('ContextMenu');
    }
});
