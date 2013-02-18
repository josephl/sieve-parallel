var app = app || {};
window.clog = function(msg) { return console.log(msg); };

(function($) {

    app.colors = {
        unmarkedfg: 'black',
        unmarkedbg: 'white',
        markedfg: '#ddd',
        markedbg: '#666',
        primefg: 'white',
        primebg: 'red'
    };
    app.delay = 100;   // sieving time (ms)
    app.locked = false;     // mutex

    /*
     * Models
     */

    var Num = Backbone.Model.extend({
        defaults: {
            marked: false
        }
    });

    var Numbers = Backbone.Collection.extend({
        model: Num,
        nextComposite: function(factor) {
            return this.find(function(n) {
                return n.get('value') % factor === 0 && !n.get('marked');
            });
        },
        markNext: function(factor) {
            var marking = this.nextComposite(factor);
            if (typeof marking !== 'undefined') {
                marking.set('marked', true);
            }
            return marking;
        },
        nextPrime: function() {
            return this.find(function(n) {
                return !n.get('marked');
            });
        },
        sieve: function() {
            if (typeof this.point === 'undefined') {
                this.point = this.nextPrime();
                this.point.set('prime', 'true');
            }
            if (typeof this.markNext(this.point.get('value')) === 'undefined') {
                this.point = this.nextPrime();
                if (typeof this.point === 'undefined') {
                    console.log('Done: ' + (((new Date()).getTime() - app.start) / 1000) + ' sec');
                    clearInterval(app.timer);
                    return undefined;
                }
                else {
                    this.point.set('prime', 'true');
                }
                var marked = this.markNext(this.point);
                //this.remove(marked);
            }
        }
    });

    //var Processor = Backbone.Model.extend({
    //    memory: Numbers

    /*
     * Views
     */

    var NumView = Backbone.View.extend({
        tagName: 'td',
        className: 'num',
        initialize: function(numModel) {
            this.model = numModel;
            this.listenTo(this.model, 'change:marked', this.render);
            this.render();
        },
        render: function() {
            this.$el.text(this.model.get('value'));
            if (typeof this.model.get('prime') !== 'undefined') {
                this.$el.css('background-color',
                    app.colors.primebg);
                this.$el.css('color',
                    app.colors.primefg);
            }
            else if (this.model.get('marked')) {
                this.$el.css('background-color',
                    app.colors.markedbg);
                this.$el.css('color',
                    app.colors.markedfg);
            }
            else {
                this.$el.css('background-color', 'white');
            }
            return this;
        }
    });

    var TableView = Backbone.View.extend({
        tagName: 'table',
        className: 'num',
        id: 'numbers',
        columns: 32,
        initialize: function() {
            var max = Math.pow(2, 10) + 1;
            this.rows = Math.ceil(max / this.columns);
            app.numlist = getRange(3, max, 2);
            var nums = app.numlist.length;
            var i = 0, rowCount, curRow;
            while (i < nums) {
                rowCount = i % this.columns;
                if (rowCount === 0) {
                    if (typeof curRow !== 'undefined') {
                        this.$el.append(curRow);
                    }
                    curRow = $('<tr id="row" class="num"></tr>');
                }
                var newNumView = new NumView(app.numlist.at(i));
                curRow.append(newNumView.el);
                i++;
            }
            if (typeof curRow !== 'undefined') {
                this.$el.append(curRow);
            }
            return this;
        }
    });

    function getRange(min, max, step) {
        var numArray = [];
        if (typeof step === 'undefined' || step < 1) { step = 1; }
        for (var i = min; i <= max; i += step) {
            numArray.push({ value: i, marked: false });
        }
        var numlist = new Numbers(numArray);
        if (numlist.at(0).get('value') === 1) {
            numlist.markNext(1);
        }
        return numlist;
    }


    //app.numlist = getRange(1, 1000);
    //for (var i = 0; i < app.numlist.length; i++) {
    //    var newNumView = new NumView(app.numlist.at(i));
    //    $('#numContainer').append(newNumView.el);
    //}
    app.table = new TableView();
    $('#numDiv').append(app.table.el);

    app.start = (new Date()).getTime();
    app.timer = setInterval(function() {
        if (!app.locked) {
            app.locked = true;
            app.numlist.sieve();
            app.locked = false;
        }
        else {
            console.log('Wait');
        }
    }, app.delay);

})(jQuery);
