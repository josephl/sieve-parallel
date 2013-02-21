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
    app.delay = 150;   // sieving time (ms)
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
        sieve: function(p, row) {
            var target = this.at(row);
            //console.log(target);
            if (target.get('value') % p.get('value') === 0) {
                target.set('marked', true);
            }
            // old ----
            // if (typeof this.point === 'undefined') {
            //     this.point = this.nextPrime();
            //     this.point.set('prime', 'true');
            // }
            // if (typeof this.markNext(this.point.get('value')) === 'undefined') {
            //     this.point = this.nextPrime();
            //     if (typeof this.point === 'undefined') {
            //         console.log('Done: ' + (((new Date()).getTime() - app.start) / 1000) + ' sec');
            //         clearInterval(app.timer);
            //         return undefined;
            //     }
            //     else {
            //         this.point.set('prime', 'true');
            //     }
            //     var marked = this.markNext(this.point);
            //     //this.remove(marked);
            // }
        }
    });

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
        rows: 16,
        primes: new Numbers(),
        initialize: function() {
            this.max = Math.pow(2, 10) + 1;  // 1025
            // app.numlist = getRange(3, max, 2);

            //var nums = this.columns * 16;
            //this.rows = Math.ceil(nums / this.columns);

            this.rowCounter = 0;

            this.initProcessors();
            this.pi = 0;

            //pre-render rows
            var rowElems = [];      // array of prerendered row dom els
            for (var i = 0; i < this.rows; i++) {
                rowElems.push($('<tr id="row" class="num"></tr>'));
            }

            // add cells vertically
            //for (var i = 0; i < nums; i++) {
            //    var newNumView = new NumView(app.numlist.at(i));
            //    rowElems[i % this.rows].append(newNumView.el);
            //}

            for (var i = 0; i < this.columns; i++) {
                for (var j = 0; j < this.processors[i].length; j++) {
                    var newNumView = new NumView(this.processors[i].at(j));
                    rowElems[j].append(newNumView.el);
                }
            }

            // add all rows to dom
            for (var i = 0; i < this.rows; i++) {
                this.$el.append(rowElems[i]);
            }

            return this;
        },
        initProcessors: function() {
            this.processors = [];   // collection of collections
            var step = 2;
            for (var i = 0; i < this.columns; i++) {
                var min = i * this.rows * step + 3,
                    max = (i + 1) * this.rows * step + 1;
                this.processors.push(getRange(min, max, step));
            }
        },
        getLength: function() {
            var len = 0;
            for (var i = 0; i < this.columns; i++) {
                len += this.processors[i].length;
            }
            return len;
        },
        parallelSieve: function() {
            // perform parallel sieve for each processor
            var nextPrime;
            if (this.rowCounter === 0) {
                nextPrime = this.getNextPrime();
                nextPrime.set('prime', true);
                this.primes.add(nextPrime);
            }
            for (var i = 0; i < this.processors.length; i++) {
                this.processors[i].sieve(
                    this.primes.at(this.primes.length - 1), this.rowCounter);
            }
            //this.pi++;
            if (++this.rowCounter == this.rows) {
                this.rowCounter = 0;
            }
        },
        getNextPrime: function() {
            // search thru processors for next prime
            var nextPrime, counter = 0;
            while (typeof nextPrime === 'undefined' &&
                counter < this.getLength()) {
                for (var col = 0; col < this.columns &&
                    typeof nextPrime === 'undefined'; col++) {
                    nextPrime = this.processors[col].nextPrime();
                }
                counter++;
            }
            return nextPrime;
        },
        remainingPrime: function() {
            // all unmarked numbers are now prime
            for (var i = 0; i < this.processors.length; i++) {
                var unmarked = this.processors[i].where({ marked: false });
                for (var j = 0; j < unmarked.length; j++) {
                    unmarked[j].set('prime', true);
                    unmarked[j].set('marked', true);
                    this.primes.add(unmarked[j]);
                }
            }
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
            app.table.parallelSieve();
            app.locked = false;
            var lastPrime = app.table.primes.at(app.table.primes.length - 1);
            if (Math.pow(lastPrime.get('value'), 2)
                > app.table.max) {
                // done sieving. stop timer, mark the rest as prime
                clearInterval(app.timer);
                app.table.remainingPrime();
                console.log('Done: ' +
                    (((new Date()).getTime() - app.start) / 1000 ) +
                    's with a step delay of ' + app.delay + 'ms');
            }
        }
        else {
            console.log('Wait');
        }
    }, app.delay);

})(jQuery);
