function runExperiment(){

	serverPsych.request(function (settings){

		timeline = [];

		//créer une liste avec tous les sons sur le serveur.
		var stimuliList = jsPsych.randomization.shuffle(settings.resources.audio);

		function boolean_random(){
			var bool_choices = [0,1];
			bool_choices = jsPsych.randomization.shuffle(bool_choices);
			return bool_choices[0];
		}

		function findByTone(list){

			var selected = {
			};

			list.forEach(function(elem){
				var path_parts = elem.split("/");
				var basename = path_parts[path_parts.length-1];
				var name_parts = basename.split("_");
				var person = name_parts[0];
				var tone = name_parts[1];
				if (selected[tone] === undefined) {
					selected[tone] = {};
				}
				if (selected[tone][person] === undefined) {
					selected[tone][person] = [];
				}
				selected[tone][person].push(elem);
			});
			return selected;
		}

		var sortedAudio = settings.resources.audio.filter(function(elem){
			return !elem.includes('practice');
		});
		var abx_timeline = [];

		//iterates on all blocks of the experiment
		settings.timeline.forEach(function(block, idx, timeline){

			//block  practice abx1
			if(block.name == "abx1" && block.is_practice == true){
				block.timeline = [];
				var tableauAbxPractice=[];
				for (i=1; i<=6;i++){

					var kk = '/media/tonelearning/practices/practicek00'+i.toString()+'.wav';
					var ll= '/media/tonelearning/practices/practicel00'+i.toString()+'.wav';

					var pair1=[stimuliList.indexOf(kk),stimuliList.indexOf(ll)];

					//les pairs sont créées A B X
					var abx= [stimuliList[pair1[0]], stimuliList[pair1[1]], stimuliList[pair1[boolean_random()]]];

					tableauAbxPractice.push({stimuli: abx})
				}
				block.timeline = jsPsych.randomization.shuffle(tableauAbxPractice);
			}

      // building the intra-category pairs
      var types = ['ma1', 'ma2', 'ma3', 'ma4'];
      var people = ['female1', 'female2', 'female3', 'male1', 'male2'];

			//block  real abx1
			if(block.name == "abx1" && block.is_practice == undefined){

				var sorted = findByTone(settings.resources.audio);


				types.forEach(function(name) {
					for(var i=0; i<7; i++) {
            var randomPerson = jsPsych.randomization.shuffle(people)[0];
            var shuffled = jsPsych.randomization.shuffle(sorted[name][randomPerson]);

						var firstSound = shuffled[0];
						var secondSound = shuffled[1];
						var thirdSound = i%2 == 0 ? firstSound : secondSound;

            if (firstSound === undefined || secondSound === undefined || thirdSound === undefined) {
              console.log("debug info part 1", {
                randomPerson: randomPerson,
                shuffled: shuffled,
                firstSound: firstSound,
                secondSound: secondSound,
                thirdSound: thirdSound
              });
            }

						abx_timeline.push({stimuli: [firstSound, secondSound, thirdSound]})
					}
				});

				// building the inter-category pairs
				var pairTypes = [['ma1', 'ma2'], ['ma1', 'ma3'], ['ma1', 'ma4'], ['ma2', 'ma3'], ['ma2', 'ma4'], ['ma3', 'ma4']];

				pairTypes.forEach(function(type){
					for(var i=0; i<7; i++) {
            var randomPerson = jsPsych.randomization.shuffle(people)[0];
            var firstList = jsPsych.randomization.shuffle(sorted[type[0]][randomPerson]);
            var secondList = jsPsych.randomization.shuffle(sorted[type[1]][randomPerson]);
            var firstSound = jsPsych.randomization.shuffle(firstList)[0];
            var secondSound = jsPsych.randomization.shuffle(secondList)[1];
						var thirdSound = i%2 == 0 ? firstSound : secondSound;

            if (firstSound === undefined || secondSound === undefined || thirdSound === undefined) {
              console.log({
                randomPerson: randomPerson,
                firstList: firstList,
                secondList: secondList,
                firstSound: firstSound,
                secondSound: secondSound,
                thirdSound: thirdSound
              });
              throw "error picking samples";
            }

						if(i%2 == 0){
							abx_timeline.push({stimuli: [firstSound, secondSound, thirdSound]})
						} else {
							abx_timeline.push({stimuli: [secondSound, firstSound, thirdSound]})
						}
					}
				})

				var abx_timeline_final = jsPsych.randomization.shuffle(abx_timeline);

				var pause_trial = {
					type: 'text',
					text: 'Use this pause to rest yourself and when you are ready, press any key to return to the experiment.'
				}
				block.timeline = abx_timeline_final.splice(42, 0, pause_trial);
				block.timeline = abx_timeline_final;
				abx_timeline = block.timeline;
			}

			//block real abx2
			if(block.name == "abx2"){
				block.timeline = abx_timeline;
			}

			//block categorisation
			if(block.name == "categorisation"){
				var catarray = [];
				sortedAudio.forEach(function(file, idx){
					var type = file.slice(-7)[0]

					for(var i = 0; i < 4; i++){
						//49 = keycode for key 1
						catarray.push({stimulus:file, key_answer:48+parseInt(type), text_answer: jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(48+parseInt(type))});
					};
				});
				var shuffled_timeline = jsPsych.randomization.shuffle(catarray);

				var pause_trial = {
					type: 'text',
					text: 'Use this pause to rest yourself and when you are ready, press any key to return to the experiment.'
				}
				shuffled_timeline.splice(50, 0, pause_trial);
				shuffled_timeline.splice(100, 0, pause_trial);
				shuffled_timeline.splice(150, 0, pause_trial);
				shuffled_timeline.splice(200, 0, pause_trial);
				shuffled_timeline.splice(250, 0, pause_trial);
				shuffled_timeline.splice(300, 0, pause_trial);
				shuffled_timeline.splice(350, 0, pause_trial);

				block.timeline = shuffled_timeline;

			}

		})

		jsPsych.init({
			timeline: settings.timeline,
			on_finish:function(data){
				serverPsych.save({
					data:data
				})
			},
			display_element: 'jsPsychTarget',
			on_trial_start:function(){
				$("#jsPsychTarget")[0].scrollIntoView();
			}
		});
	})
}
