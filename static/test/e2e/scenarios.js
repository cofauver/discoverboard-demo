/* https://docs.angularjs.org/guide/e2e-testing */
/* https://docs.angularjs.org/tutorial/step_03 */
describe('App',function(){
	describe ('Tile page and overlay interactions',function(){

		beforeEach(function(){
			browser.get('app/index.html')
		})

		var startingPalette = element.all(by.repeater('article in articles'));
		var titles = element.all(by.repeater('article in articles').column('{{article.title}}'));
		var summaries = element.all(by.repeater('article in articles').column('{{article.summary}}'));
		var images = element.all(by.repeater('article in articles').column('{{article.img}}'));



		/*There should be 12 tiles when the user arrives on the page*/
		it('should present 12 tiles with a title, image, and summary when the user arrives', function(){
			expect(startingPalette.count()).toBe(12);
			expect(titles.count()).toBe(12);
			expect(summaries.count()).toBe(12);
			expect(images.count()).toBe(12)
		
		/*The get more content button should populate the page with new tiles*/
		it ('should allow the user to see more content with the "Get more content" button', function(){
			element.all(by.css('.get-more')).first().click();
			var newPalette = element.all(by.repeater('article in articles'));
			expect(newPallete).not.toBe(startingPalette);
		});

		/*Hovering over a tile should report a numerical hover time*/
		it('should report hovers upon the mouse leaving',function(){

		});

		/*Clicking a tile should report a numerical hover time*/
		it('should report hovers upon the mouse clicking', function(){

		});
		
		/*The overlay displayed should match the tile that you clicked on*/
		it('should display the appropriate overlay when a tile is clicked', function(){
			element.all(by.css('.tile-container')).get(5).click();
			expect(show).toBe(true) 				// these two tests may require more work 
			expect(article.title).toBe(titles[5]);	// to get the scope in here
		});
		
		/*Scrolling down should report at each decile, only on the first read-through*/
		it('should report scrolling progress at each decile', function(){
			element.all(by.css('.tile-container')).get(5).click();
		});
		
		/*Rating an article should send a rating report to the backend*/
		it('should report ratings when the stars are clicked', function(){
			element.all(by.css('.tile-container')).get(5).click();
			element.all(by.css('.stars')).click();
		});
		
		/*Changing tabs while reading the article should track away time*/
		it('should keep track of the time when a user is not viewing the tab', function(){
			element.all(by.css('.tile-container')).get(5).click();
		});
		
		/*Exiting an article overlay by any method (x button, clicking outside overlay,
		or back to homepage button), should prompt a (non-zero, positive) reading time 
		report that takes away time into account*/
		it('should report the reading time when a user leaves the overlay by clicking the X', function(){
			element.all(by.css('.tile-container')).get(5).click();
			element.all(by.css('.ng-modal-close')).click();
			expect(show).toBe(false);
		});
		it('should report the reading time when a user leaves the overlay by clicking outside of the overlay', function(){
			element.all(by.css('.tile-container')).get(5).click();
			element.all(by.css('.ng-modal-overlay')).click();
			expect(show).toBe(false);
		});
		it('should report the reading time when a user leaves the overlay by clicking the "Return to Hompage" button', function(){
			element.all(by.css('.tile-container')).get(5).click();
			element.all(by.css('.back-to-content')).click();
			expect(show).toBe(false);
		});

	});
});

