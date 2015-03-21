// VIEWS


// APP COMPONENT VIEWS
var Nav = function() {
  View.call(this, null);  
  delete this.model;
};

var Module = function(collection, options) {
  CollectionView.call(this, collection, options);
  
  if (!this.render) {
    this.render = function() { this.display(); };
  }
  
  if (!this.update) {
    this.update = function(action, data) {
      if (action == 'setWorkview' && data != this.workview) { this.hide(); }
    };
  }
  
  appView.observers.add('setWorkview', this);
};

var Popup = function() {
  View.call(this, null);
  delete this.model;
};


// ITEM VIEWS
var TextView = function(model, options) {
  View.call(this, model, $('#textTemplate'));
  
  workview = 'texts';
  
  this.nextPhrase = function() {
    var numPhrases = app.preferences.currentText.phrases.length;

    var selected = $('.selected');
    
    if (selected) {
      selected.classList.remove('selected');
    }
    
    if (app.preferences.currentPhrase[1] == numPhrases-1) {
      app.preferences.currentPhrase[1] = 0;
    } else {
      app.preferences.currentPhrase[1] += 1;
    }
    
    var newSelected = $('.phrase').filter(function(phrase) {
      return checkAgainst(app.preferences.currentPhrase, Breadcrumb.parse(phrase.dataset.breadcrumb))
    })[0];
    
    newSelected.classList.add('selected');
    var textItem = newSelected.querySelector('.wrapper p:first-child')
    textItem.focus();
    range = new Range();
    range.selectNodeContents(textItem);
    range.collapse(false);
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },
  
  this.prevPhrase = function() {
  },
  
  this.render = function() {
    $('#detailsPane .displayArea').innerHTML = '';
    
    var tv = this.template.content.querySelector('.text').cloneNode(true);
    
    tv.querySelector('#abbrBox').value = this.model.abbreviation;
    
    // Render titles
    Object.keys(this.model.titles).forEach(function(key) {
      var li = createElement('li', { id: key });
      var label = createElement('label', { htmlFor: key });
      var p = createElement('p', { textContent: key });
      var input = createElement('input', { value: this.model.titles[key] || '', id: key, type: 'text' });
      input.classList.add('title');
      
      label.appendChild(p);
      label.appendChild(input);
      li.appendChild(label);
      tv.querySelector('.titles').appendChild(li);
      
      input.addEventListener('blur', this.model.store);
      
    }, this);
    
    $('#detailsPane .displayArea').appendChild(tv);
    
    this.el = tv;
    
    // Render phrases
    phraseWrapper = this.el.querySelector('.phrases');
    
    options.textAbbr = this.model.abbreviation;

    this.model.phrases.render(phraseWrapper, options);
    
    // Load media
    var setMedia = function(media) {
      media.forEach(function(mediaObj) {
        var li = createElement('li');
        
        var audio = createElement('audio', {
          controls: true,
          src: URL.createObjectURL(mediaObj.file)
        });
        
        li.appendChild(audio);
        
        var img = createElement('img', { src: 'img/delete.svg', alt: 'delete this media from this text', id: mediaObj.id });
        img.classList.add('icon');
        
        li.appendChild(img);
        
        this.el.querySelector('.media').appendChild(li);
        
        img.addEventListener('click', function(ev) {
          this.model.media.forEach(function(mediaID, i) {
            if (mediaID = ev.target.id) { this.model.media.splice(i, 1); }
            this.model.store(function() { this.render(); }.bind(this));
          }, this);
        }.bind(this));
      }, this);
    }.bind(this);
    
    this.model.get('media', setMedia);
    
    // Add event listeners
    this.el.querySelector('#addMediaToTextButton').addEventListener('click', function() {
      var goButtonCallback = function(file) {
        var data = {
          file: file,
          textStart: null,
          textEnd: null
        };
        
        var media = new models.MediaFile(data);
        
        var addRender = function(mediaIDs) {
          media.addToCorpus();
          this.model.media.push(mediaIDs[0]);
          this.model.store();
          this.render();
        }.bind(this);
        
        media.store(addRender);
      }.bind(this);
      
      popups.fileUpload.render(goButtonCallback);
    }.bind(this));
    
    this.el.querySelector('#deleteTextButton').addEventListener('click', function(ev) {
      this.hide();
      this.model.removeFromCorpus();
      appView.setWorkview('texts');
      this.notify('deleteText');
    }.bind(this));

    this.el.querySelector('.phrases').addEventListener('blur', function(ev) {
      app.preferences.currentText.store();
    }, true);
    
    this.el.querySelector('.phrases').addEventListener('click', function(ev) {
      if (ev.target.classList.contains('play')) {
        var crumb = Breadcrumb.parse(ev.target.parentNode.dataset.breadcrumb);
        var phrase = this.model.phrases[crumb[1]];
        phrase.play();
      }
      
      if (ev.target.classList.contains('phrase')) {
        $('.phrase').forEach(function(phraseEl) { phraseEl.classList.remove('selected'); });
        ev.target.classList.add('selected');
        app.preferences.currentPhrase = Breadcrumb.parse(ev.target.dataset.breadcrumb);
      }
      
      if (ev.target.classList.contains('phraseContent')) {
        var selected = $('.selected');
        if (selected.length > 0) { selected[0].classList.remove('selected'); }
        ev.target.parentNode.parentNode.classList.add('selected');
        app.preferences.currentPhrase = Breadcrumb.parse(ev.target.parentNode.parentNode.dataset.breadcrumb);
      }
    }.bind(this));

    this.el.querySelector('.phrases').addEventListener('input', function(ev) {
      if (ev.target.classList.contains('phraseContent')) {
        var crumb = Breadcrumb.parse(ev.target.parentNode.parentNode.dataset.breadcrumb);
        app.preferences.currentText.phrases[crumb[1]][ev.target.dataset.type][ev.target.dataset.ortho] = ev.target.textContent;
      }
    });
    
    this.el.querySelector('.phrases').addEventListener('keydown', function(ev) {
      if (ev.keyCode == 13 || ev.keyCode == 27) {
        ev.preventDefault();
        ev.target.blur();
        app.preferences.currentText.store();
      }
    });
    
    this.el.querySelector('.text header').addEventListener('input', function(ev) {
      if (ev.target.classList.contains('title')) { this.model.titles[ev.target.id] == ev.target.value; }
      if (ev.target.id == 'abbrBox') { this.model.abbreviation = ev.target.value; }
    }.bind(this));
    
    this.el.querySelector('.text header').addEventListener('keyup', function(ev) {
      if (ev.keyCode == 13 || ev.keyCode == 27) {
        ev.target.blur();
        if (ev.target.classList.contains('title')) { this.model.titles[ev.target.id] == ev.target.value; }
        if (ev.target.id == 'abbrBox') { this.model.abbreviation = ev.target.value; }
        this.notify('headerChange');
        this.model.store();
      }
    }.bind(this));
    
    this.display();
  };
  
  this.update = function(action, data) {
    if (action == 'setWorkview' && data != this.workview) { this.hide(); }
    if (action == 'nextPhrase') { this.nextPhrase(); }
    if (action == 'prevPhrase') { this.prevPhrase(); }
  };
  
  // Event subscriptions
  appView.observers.add('nextPhrase', this);
  appView.observers.add('prevPhrase', this);
  appView.observers.add('setWorkview', this);
};

var PhraseView = function(model) {
  View.call(this, model, null);
  
  this.template = $('#phraseTemplate');
  
  this.render = function(wrapper, options) {
    var pv = this.template.content.querySelector('.phrase').cloneNode(true);
    pv.dataset.breadcrumb = Breadcrumb.stringify(model.breadcrumb);
    var contentWrapper = pv.querySelector('.wrapper');
    
    var keyText = model.breadcrumb[1] + 1;
    if (options.textAbbr) { keyText = options.textAbbr + ': ' + keyText }
    
    var key = createElement('abbr', { textContent: keyText });
    contentWrapper.appendChild(key);
    
    var renderText = function(textHash, type) {
      Object.keys(textHash).forEach(function(ortho) {
        var p = createElement('p', { textContent: textHash[ortho], spellcheck: false });
        if (options.contentEditable == true) {
          p.contentEditable = true;
        }
        p.dataset.type = type;
        p.dataset.ortho = ortho;
        p.classList.add('phraseContent');
        p.classList.add('unicode');
        contentWrapper.appendChild(p);
      }, this);
    }.bind(this);
    
    renderText(this.model.transcripts, 'transcripts');
    renderText(this.model.transcriptions, 'transcriptions');
    renderText(this.model.translations, 'translations');
    renderText(this.model.notes, 'notes');

    wrapper.appendChild(pv);
    
    this.el = pv;
  }.bind(this);
};

var TextsListView = function(texts) {
  CollectionView.call(this, texts);
  
  this.populateListItem = function(text, li) {
    li.dataset.id = text.id;
    li.classList.add('textsListItem');
    var checkbox = createElement('input', { type: 'checkbox', name: 'textCheckbox', value: text.id });
    li.appendChild(checkbox);
    var abbr = createElement('abbr', { textContent: text.abbreviation });
    li.appendChild(abbr);
    var title = createElement('p', { textContent: text.titles.Eng || '[click to display this text]' });
    title.classList.add('unicode');
    li.appendChild(title);
  };
  
  this.render = function(wrapper) {
    wrapper.innerHTML = '';
    createList(wrapper, this.collection, this.populateListItem);
  }.bind(this);
};