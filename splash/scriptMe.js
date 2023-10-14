(function(obj){
  var social_media = obj.socialMedia;
  var gravatar_url = obj.avatarUrl;
  var main_text = obj.message;
  var styles = obj.style;
  var iconSize = 50;
  
  var loadStyle = function() {
    var styleEl = document.createElement('style');
    var head = document.querySelector('head');
    styleEl.appendChild(document.createTextNode(styles));
    head.appendChild(styleEl);
  };
  
  // Let's do this before anything else runs.
  // Prevents flashes of unstyled content
  loadStyle();
  
  // Preload the image, return the URL for kicks and giggles
  var loadGravatar = function() {
    var gravatarImage = new Image;
    gravatarImage.src = gravatar_url;
    return gravatar_url;
  };
  
  // Utility function to change CSS of a node using an object
  // of properties and values
  var applyStyles = function(el, styles) {
    Object.keys(styles).forEach(function(property) {
      el.style[property] = styles[property];
    });
  };
  
  // Primary Container
  var container = document.createElement('div');
      container.className = 'co-container';
  
  // Primary Interactive Anchor
  var primaryA = document.createElement('a');
  
  // Avatar Image
  var img = document.createElement('img');
      img.src = loadGravatar();
      img.className = 'co-gravatar';
  
  // Put the image inside of the anchor tag
  primaryA.appendChild(img);
  
  // Content things!
  var p = document.createElement('p');
      applyStyles(p, {
        opacity: '0',
        textAlign: 'center',
      });
      p.innerHTML = main_text;

  
  var ul = document.createElement('ul');
      applyStyles(ul, {
        opacity: '0',
        display: 'flex',
        listStyle: 'none',
        padding: '0',
        flexFlow: 'row wrap',
      });
  
  // Build our Social Media link list
  social_media.forEach(function(sm) {
    var li = document.createElement('li');
        applyStyles(
          li,
          {
            flex: '1 0 50%'
          }
        );
    var a = document.createElement('a');
        a.rel = 'nofollow noreferrer noopener';
        a.target = '_blank';
        a.href = sm.url;
        a.innerHTML = sm.name;
    
    // Append and conquer
    li.appendChild(a);
    ul.appendChild(li);
  });
  
  // Let's put it all in our container in order
  container.appendChild(primaryA);
  container.appendChild(p);
  container.appendChild(ul);
  
  // Finally, toss that sucker in the body
  document.querySelector('body').appendChild(container);
  
  /* Animation Section */
  var step;
  var startingPos = 20;
  var maxPos = 100;
  var pos = startingPos; // We're not starting from zero.
  
  // Animation Execution
  function animate(msFrameRate, reverse, cb) {
    // Let's do that step.
    step = setInterval(function(){
      // First, adjust the anticipated position
      pos = (reverse) ? pos - 1 : pos + 1;
      // Check to see if we're at either end
        console.log( { pos });
      if( ( pos === maxPos ) || ( pos === startingPos ) ) {
        // If so, stop what we're doing!
        clearInterval(step);
      } else {
        // Otherwise, continue the animation with the new position
        cb(pos, reverse); 
      }
    }, msFrameRate);
  }
  
  // Animation definition
  function cardAnimation(pos, reverse) {
    
    // Main Container
    applyStyles(
      container,
      {
        height: ( pos * 2.3 ) + 'px',
        width: ( pos * 2 ) + 'px',
        bottom: ( 20 - ( pos * 0.2 ) ) + 'px',
        right: ( 20 - ( pos * 0.2 ) ) + 'px',
        borderRadius: ( 52 - ( pos * 0.5 ) )  + '%',
        overflow: 'visible',
        padding: (pos*0.1) + 'px',
      }
    );
    
    // Don't make it too large when expanding
    var imageScale = ( ( 20 + pos * 0.5 ) < 70 ) ? ( 20 + pos * 0.5 ) : 70;
    // Don't make it too small when shrinking
    if(reverse)
        imageScale = (imageScale > 50) ? imageScale : 50;
    
    // Avatar
    applyStyles(
      img,
      {
        border: '4px solid #fff',
        boxShadow: '1px 1px 2px 1px #9f9f9f',
        marginTop: (pos * -0.4) + 'px',
        position: 'relative',
        left: 'calc( 50% - ' + ( imageScale * 0.6 ) + 'px)',
        height: imageScale + 'px',
        width: imageScale + 'px'
      }
    );
    
    // This fades in the text and links
    if( pos > (maxPos-5) ) {
      setTimeout(function() {
        p.style.opacity = 1;
        ul.style.opacity = 1
      }, 5);
    }
    
    // This fades out the text and links
    if ( pos < (maxPos-1) ) {
      p.style.opacity = 0;
      ul.style.opacity = 0;
    }

    // This removes the `style` attribute
    // which resets the array of elements
    // to their default setting
    if(reverse && pos === ( startingPos + 1 ) ) {
      [
        container,
        img
      ].forEach(function(el){
        el.removeAttribute('style');
      });
    }
  }
  
  function eventHandler(e) {
    clearInterval(step);
    animate(1, pos === maxPos, cardAnimation);
  }
  
  // Desktop Listeners
  container.addEventListener('mouseenter', eventHandler);
  container.addEventListener('mouseleave', eventHandler);
  
  // Mobile Listener
  primaryA.addEventListener('touchstart', function(e){
    e.preventDefault();
    eventHandler();
  });
  
})(
  {
    avatarUrl: 'https://gravatar.com/avatar/c88d6da4777ebf0cc5f28ceee806cab515891227b255fcacc2f15e0565dfc693?s=200',
    message: 'Hi,! I am Emin Fidan! <br>I develop and implement <br>high-quality solutions <br>for student recruitment <br>and marketing strategies.',
    socialMedia: [
     
      {
        name: 'Linkedin',
        url: 'https://linkedin.com/in/emindevrimfidan'
      },
      {
        name: 'Blog',
        url: 'https://emin.devrimfidan.com'
      },
      {
        name: 'GitHub',
        url: 'https://github.com/devrimfidan'
      },
      {
        name: 'CodePen',
        url: 'https://codepen.io/devrimfidan'
      }
      
    ],
    style: ".co-container {\n border-radius: 50%;\n height: 50px;\n width: 50px;\n overflow: hidden;\n border: 2px solid #fff;\n box-shadow: 1px 1px 2px 1px #9f9f9f;\n -webkit-transform: all 300ms linear;\n transform: all 300ms linear;\n background-color: #fafafa;\n position: fixed;\n bottom: 20px;\n right: 20px;\n white-space: nowrap;\n -webkit-user-select: none;\n -moz-user-select: none;\n -ms-user-select: none;\n user-select: none;\n padding: 0;\n color: #212121;\n}\n.co-container:hover {\n border: 3px solid #eee;\n box-shadow: none;\n}\n.co-container img.co-gravatar {\n border-radius: 50%;\n height: 50px;\n width: 50px;\n display: block;\n}\n.co-container p,\n.co-container ul {\n transition: opacity 100ms linear;\n}\n.co-container ul a {\n display: block;\n padding: 8px 0;\n text-align: center;\n text-decoration: none;\n box-sizing: border-box;\n border: 1px solid transparent;\n color: #145a89;\n}\n.co-container ul a:hover {\n box-sizing: border-box;\n background-color: rgba(20, 90, 137, 0.1);\n border: 1px solid #a1d1f1;\n}"
  }
);