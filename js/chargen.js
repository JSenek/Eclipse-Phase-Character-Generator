var myCharacter, currentSection;
var backgroundData, factionData, morphData, skillData, positiveTraitData, negativeTraitData, psiData;
var bgChoices, facChoices, morphChoices;
function Character() {
	this.name = "";
	this.concept = "";
	// Ego Setup
	this.ego = {};
	this.ego.COG = 15;
	this.ego.COO = 15;
	this.ego.INT = 15;
	this.ego.REF = 15;
	this.ego.SAV = 15;
	this.ego.SOM = 15;
	this.ego.WIL = 15;
	this.ego.MOX = 1;
	this.ego.SPD = 1;
	this.ego.background = 0;
	this.ego.faction = 0;
	this.ego.positiveTraits = [];
	this.ego.negativeTraits = [];
	this.ego.reputations = {};
	this.ego.psiSleights = {};
	this.ego.psiSleights.Chi = [];
	this.ego.psiSleights.totalChi = 0;
	this.ego.psiSleights.Gamma = [];
	this.ego.psiSleights.totalGamma = 0;
	this.ego.skills = [];
	this.ego.CRED = 5000;
	// Morph Setup
	this.morph = {};
	this.morph.ID = 0;
	this.morph.temp = 0;
	this.morph.positiveTraits = [];
	this.morph.negativeTraits = [];
	// Other
	this.CP = 1000;
	this.CPSpentOnKnowledgeSkills = 0;
	this.CPSpentOnActiveSkills = 0;
	this.CPSpentOnPositiveTraits = 0;
	this.CPGainedFromNegativeTraits = 0;
	this.CPGainedFromNegativeMorphTraits = 0;
	this.creditSpent = 0;
}

function keypress(e) {
	var evtobj, unicode;
	evtobj = (window.event)? event : e; //distinguish between IE's explicit event object (window.event) and Firefox's implicit.
	unicode = (evtobj.charCode) ? evtobj.charCode : evtobj.keyCode;
	if (unicode === 13) {
		document.getElementById("nextButton").click();
	}
}

function lookupSkillID(name) {
	var i;
	for (i = 0; i < skillData.length; i++) {
		if (skillData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === name) {
			return i;
		}
	}
	alert("Skill " + name + " not found.");
	return -1;
}

function objectLength(obj) {
    var length = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
			length++;
		}
    }
    return length;
}

function updateCP() {
	document.getElementById("totalCP").innerHTML = myCharacter.CP;
	document.getElementById("totalCP").color = (myCharacter.CP >= 0) ? "black" : "red";
	document.getElementById("activeSkillsCP").innerHTML = myCharacter.CPSpentOnActiveSkills;
	document.getElementById("activeSkillsCP").color = (myCharacter.CPSpentOnActiveSkills < 400) ? "red" : "black";
	document.getElementById("knowledgeSkillsCP").innerHTML = myCharacter.CPSpentOnKnowledgeSkills;
	document.getElementById("knowledgeSkillsCP").color = (myCharacter.CPSpentOnKnowledgeSkills < 300) ? "red" : "black";
	document.getElementById("negativeMorphTraitsCP").innerHTML = myCharacter.CPGainedFromNegativeMorphTraits;
	document.getElementById("negativeMorphTraitsCP").color = (myCharacter.CPGainedFromNegativeMorphTraits <= 25) ? "black" : "red";
	document.getElementById("negativeTraitsCP").innerHTML = myCharacter.CPGainedFromNegativeTraits;
	document.getElementById("negativeTraitsCP").color = (myCharacter.CPGainedFromNegativeTraits <= 50) ? "black" : "red";
	document.getElementById("positiveTraitsCP").innerHTML = myCharacter.CPSpentOnPositiveTraits;
	document.getElementById("positiveTraitsCP").color = (myCharacter.CPSpentOnPositiveTraits <= 50) ? "black": "red";
	document.getElementById("psiChiSleights").innerHTML = myCharacter.ego.psiSleights.totalChi;
	document.getElementById("psiChiSleights").color = (myCharacter.ego.psiSleights.totalChi > 5) ? "red": "black";
	document.getElementById("psiGammaSleights").innerHTML = myCharacter.ego.psiSleights.totalGamma;
	document.getElementById("psiGammaSleights").color = (myCharacter.ego.psiSleights.totalGamma > 5) ? "red": "black";
}

// Trait Functions
function lookupTraitID(type, name, source) {
	var i;
	for (i in myCharacter.ego[type + "Traits"]) {
		if (myCharacter.ego[type + "Traits"].hasOwnProperty(i)) {
			if ((type === "positive") && (positiveTraitData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === name) && (positiveTraitData[i].getElementsByTagName("source")[0].childNodes[0].nodeValue === source)) {
				return i;
			}
			if ((type === "negative") && (negativeTraitData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === name) && (negativeTraitData[i].getElementsByTagName("source")[0].childNodes[0].nodeValue === source)) {
				return i;
			}
		}
	}
	alert("Trait " + name + " of type " + type + " and source " + source + " not found.");
	return -1;
}

function checkTraitReqs(type, name, source, silent) {
	var tempData, traitID, i, flag, morphType;
	traitID = lookupTraitID(type, name, source);
	if (type === "positive"){
		tempData = positiveTraitData;
	} else {
		tempData = negativeTraitData;
	}
	// Infomorphs aren't really morphs and can't buy morph traits
	morphType = morphData[myCharacter.morph.ID].getElementsByTagName("type")[0].childNodes[0].nodeValue;
	if ((morphType === "Infomorph") && (source === "Morph")) {
		if (!silent) {
			alert("This trait requires a physical body.");
		}
		return 0;
	}
	// Check if another trait is required first.
	if (tempData[traitID].getElementsByTagName("requires").length !== 0) {
		if ((!myCharacter.ego[type + "Traits"][lookupTraitID(type, tempData[traitID].getElementsByTagName("requires")[0].childNodes[0].nodeValue, source)]) && (!myCharacter.morph[type + "Traits"][lookupTraitID(type, tempData[traitID].getElementsByTagName("requires")[0].childNodes[0].nodeValue, source)])) {
			if (!silent) {
				alert(name + " requires " + tempData[traitID].getElementsByTagName("requires")[0].childNodes[0].nodeValue + ".");
			}
			return 0;
		}
	}
	// Check for morph compliance
	tempData = tempData[traitID].getElementsByTagName("requiredmorph");
	flag = (tempData.length === 0) ? 1 : 0;
	for (i = 0; i < tempData.length; i++) {
		// Check if morph name or type match
		if ((morphData[myCharacter.morph.ID].getElementsByTagName("name")[0].childNodes[0].nodeValue === tempData[i].childNodes[0].nodeValue) || (morphType === tempData[i].childNodes[0].nodeValue)) {
			flag = 1;
		}
		// Uplifts and Pods count as biomorphs
		if ((tempData[i].childNodes[0].nodeValue === "Biomorph") && ((morphType === "Uplift") || (morphType === "Pod"))) {
			flag = 1;
		}
	}
	if (!flag) {
		if (!silent) {
			alert(name + " is not compatible with your selected morph.");
		}
		return 0;
	}
	return 1;
}

function purchaseTrait(type, name, source, mod, free) {
	var enables = 0, traitID = lookupTraitID(type, name, source), temp, i;
	if (type === "positive") {
		// Charge CP only if its not already possessed and not free
		if ((!myCharacter.ego.positiveTraits[traitID]) && (!myCharacter.morph.positiveTraits[traitID]) && (!free)) {
			myCharacter.CP -= parseInt(positiveTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			myCharacter.CPSpentOnPositiveTraits += parseInt(positiveTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
		}
		if (source === "Ego"){
				myCharacter.ego.positiveTraits[traitID] = 1;
			} else {
				myCharacter.morph.positiveTraits[traitID] = 1;
		}
		if (positiveTraitData[traitID].getElementsByTagName("enables").length !== 0){
				enables = positiveTraitData[traitID].getElementsByTagName("enables")[0].childNodes[0].nodeValue;
		}
		if (name === "Psi (Level 2)") { // Enable gamma sleights
			temp = document.getElementsByName("sleightBox");
			for (i = 0; i < temp.length; i++) {
				if (temp[i].dataset.sleightType === "Gamma") {
					temp[i].disabled = false;
				}
			}
		}
	}
	if (type === "negative") {
		// Give CP only if its not already possessed and not free
		if ((!myCharacter.ego.negativeTraits[traitID]) && (!myCharacter.morph.negativeTraits[traitID]) && (!free)) {
			myCharacter.CP += parseInt(negativeTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			myCharacter.CPGainedFromNegativeTraits += parseInt(negativeTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			if (source === "Morph") {
				myCharacter.CPGainedFromNegativeMorphTraits += parseInt(negativeTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			}
		}
		if (name === "Blacklisted") { // Lock in blacklisted choice, since its cost fluxates
			document.getElementById("traitBlacklistedChoice").disabled = true;
		}
		if (source === "Ego"){
			myCharacter.ego.negativeTraits[traitID] = 1;
		} else {
			myCharacter.morph.negativeTraits[traitID] = 1;
		}
		if (negativeTraitData[traitID].getElementsByTagName("enables").length !== 0){
			enables = negativeTraitData[traitID].getElementsByTagName("enables")[0].childNodes[0].nodeValue;
		}
	}
	// Enable any traits that depend on this one
	if (enables !== 0) {
		document.getElementById("trait" + enables + source).disabled = false;
	}
}

function removeTrait(type, name, source, mod, norefund) {
	var enables = 0, traitID = lookupTraitID(type, name, source), temp, i;
	if (type === "positive") {
		if (((myCharacter.ego.positiveTraits[traitID]) || (myCharacter.morph.positiveTraits[traitID])) && (!norefund)) {
			myCharacter.CP += parseInt(positiveTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			myCharacter.CPSpentOnPositiveTraits -= parseInt(positiveTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
		}
		myCharacter.ego.positiveTraits[traitID] = 0;
		myCharacter.morph.positiveTraits[traitID] = 0;
		if (positiveTraitData[traitID].getElementsByTagName("enables").length !== 0){
			enables = positiveTraitData[traitID].getElementsByTagName("enables")[0].childNodes[0].nodeValue;
		}
			// Refund and/or disable psi sleights
		if (name === "Psi (Level 1)") { // Chi
			temp = document.getElementsByName("sleightBox");
			for (i = 0; i < temp.length; i++) {
				if ((temp[i].checked) && (temp[i].dataset.sleightType === "Chi")) {
					temp[i].checked = false;
					myCharacter.CP += 5;
					myCharacter.ego.psiSleights["totalChi"]--;
					myCharacter.ego.psiSleights["Chi"][temp[i].dataset.sleightId] = 0;
				}
			}
		}
		if (name === "Psi (Level 2)") { // Gamma
			temp = document.getElementsByName("sleightBox");
			for (i = 0; i < temp.length; i++) {
				if (temp[i].dataset.sleightType === "Gamma") {
					if (temp[i].checked) {
						temp[i].checked = false;
						myCharacter.CP += 5;
						myCharacter.ego.psiSleights["totalGamma"]--;
						myCharacter.ego.psiSleights["Gamma"][temp[i].dataset.sleightId] = 0;
					}
					temp[i].disabled = true;
				}	
			}
		}
	}
	if (type === "negative") {
		if (((myCharacter.ego.negativeTraits[traitID]) || (myCharacter.morph.negativeTraits[traitID])) && (!norefund)) {
			myCharacter.CP -= parseInt(negativeTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			myCharacter.CPGainedFromNegativeTraits -= parseInt(negativeTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			if (source === "Morph") {
				myCharacter.CPGainedFromNegativeMorphTraits -= parseInt(negativeTraitData[traitID].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10) + mod;
			}
		}
		if (name === "Blacklisted") { // Unlock blacklisted choice
			document.getElementById("traitBlacklistedChoice").disabled = false;
		}
		myCharacter.ego.negativeTraits[traitID] = 0;
		myCharacter.morph.negativeTraits[traitID] = 0;
		if (negativeTraitData[traitID].getElementsByTagName("enables").length !== 0){
			enables = negativeTraitData[traitID].getElementsByTagName("enables")[0].childNodes[0].nodeValue;
		}
	}
	// Disable and refund any traits that depend on this one
	if (enables !== 0) {
		document.getElementById("trait" + enables + source).disabled = true;
		if (document.getElementById("trait" + enables + source).checked) {
			document.getElementById("trait" + enables + source).checked = false;
			removeTrait(type, enables, source, 0, norefund);
		}
	}
}

function applyTemplate(origin) { // Apply faction, background, or morph features
	var j, k, type, name, source, tempData, amount;
	switch (origin) {
	case "background":
		source = "Ego";
		data = backgroundData[myCharacter.ego.background];
		break;
	case "faction":
		source = "Ego";
		data = factionData[myCharacter.ego.faction];
		break;
	case "morph":
		source = "Morph";
		data = morphData[myCharacter.morph.ID];
		break;
	default:
		alert("Unexpected template origin " + origin + ".");
		return;
	}
	for (j = 0; j < 2; j++) {
		tempData = (j === 0) ? data.getElementsByTagName("advantages") : data.getElementsByTagName("disadvantages");
		// Apply traits
		tempData = tempData[0].getElementsByTagName("trait");
		type = (j === 0) ? "positive" : "negative";
		for (k = 0; k < tempData.length; k++) {
			name = tempData[k].childNodes[0].nodeValue;
			document.getElementById("trait" + name + source).checked = true;// Check
			purchaseTrait(type, name, source, 0, true); // Purchase (free)
			document.getElementById("trait" + name + source).disabled = true; // Lock
		}
		// Disable any restricted traits
		tempData = (j === 0) ? data.getElementsByTagName("advantages") : data.getElementsByTagName("disadvantages");
		tempData = tempData[0].getElementsByTagName("restrictedtrait");
		for (k = 0; k < tempData.length; k++) {
			name = tempData[k].childNodes[0].nodeValue;
			document.getElementById("trait" + name + source).disabled = true;
		}
		// Apply stat mods
		tempData = (j === 0) ? data.getElementsByTagName("advantages") : data.getElementsByTagName("disadvantages");
		tempData = tempData[0].getElementsByTagName("statmod");
		for (k = 0; k < tempData.length; k++) {
			name = tempData[k].getElementsByTagName("name")[0].childNodes[0].nodeValue;
			amount = parseInt(tempData[k].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
			if (source === "Ego") {
				myCharacter.ego[name] += amount;
			}
			if (source === "Morph") {
				myCharacter.morph[name] += amount;
			}
		}
	}
}

function removeTemplate(origin) { // Remove faction, background, or morph features
	var j, k, type, name, source, tempData;
	switch (origin) {
	case "background":
		source = "Ego";
		data = backgroundData[myCharacter.ego.background];
		break;
	case "faction":
		source = "Ego";
		data = factionData[myCharacter.ego.faction];
		break;
	case "morph":
		source = "Morph";
		data = morphData[myCharacter.morph.ID];
		break;
	default:
		alert("Unexpected template origin " + origin + ".");
		return;
	}
	for (j = 0; j < 2; j++) {
		tempData = (j === 0) ? data.getElementsByTagName("advantages") : data.getElementsByTagName("disadvantages");
		// Remove traits
		tempData = tempData[0].getElementsByTagName("trait");
		type = (j === 0) ? "positive" : "negative";
		for (k = 0; k < tempData.length; k++) {
			name = tempData[k].childNodes[0].nodeValue;
			if (document.getElementById("trait" + name + source).checked){
				document.getElementById("trait" + name + source).checked = false;// Un-check
				removeTrait(type, name, source, 0, true); // Remove (norefund)
			}
			document.getElementById("trait" + name + source).disabled = false; // Un-lock
		}
		// Re-enable any restricted traits
		tempData = (j === 0) ? data.getElementsByTagName("advantages") : data.getElementsByTagName("disadvantages");
		tempData = tempData[0].getElementsByTagName("restrictedtrait");
		for (k = 0; k < tempData.length; k++) {
			name = tempData[k].childNodes[0].nodeValue;
			document.getElementById("trait" + name + source).disabled = false;
		}
		// Remove stat mods
		tempData = (j === 0) ? data.getElementsByTagName("advantages") : data.getElementsByTagName("disadvantages");
		tempData = tempData[0].getElementsByTagName("statmod");
		for (k = 0; k < tempData.length; k++) {
			name = tempData[k].getElementsByTagName("name")[0].childNodes[0].nodeValue;
			amount = parseInt(tempData[k].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
			if (source === "Ego") {
				myCharacter.ego[name] -= amount;
			}
			if (source === "Morph") {
				myCharacter.morph[name] -= amount;
			}
		}
	}
}

function toggleTrait() {
	var mod = 0, facName, type, name, source;
	type = this.dataset.traitType;
	name = this.dataset.traitName;
	source = this.dataset.traitSource;
	// Adjust mod if own faction was selected for Blacklisted trait
	if (name === "Blacklisted") {
		facName = factionData[myCharacter.ego.faction].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		switch (document.getElementById("traitBlacklistedChoice").value) {
		case "ARep":
			if ((facName === "Anarchist") || (facName === "Barsoomian") || (facName === "Extropian") || (facName === "Scum") || (facName === "Titanian")) {
				mod += 15;
			}
			break;
		case "CRep":
			if ((facName === "Hypercorp") || (facName === "Jovian") || (facName === "Lunar") || (facName === "Venusian")) {
				mod += 15;
			}
			break;
		case "ERep":
			break;
		case "FRep":
			if ((facName === "Socialite")) {
				mod += 15;
			}
			break;
		case "GRep":
			if ((facName === "Criminal")) {
				mod += 15;
			}
			break;
		case "IRep":
			break;
		case "RRep":
			if ((facName === "Argonaut") || (facName === "Mercurial") || (facName === "Ultimate")) {
				mod += 15;
			}
			break;
		default:
			alert("Unexpected Blacklisted trait choice " + document.getElementById("traitBlacklistedChoice").value);
		}
	}
	// Adjust mod if uplift is buying or removing certain traits
	if (morphData[myCharacter.morph.ID].getElementsByTagName("type") === "Uplift") {
		if ((name === "Striking Looks (Level 1)") || (name === "Striking Looks (Level 2)")) {
			mod -= 5;
		}
		if ((name === "Unattractive (Level 1)") || (name === "Unattractive (Level 2)") || (name === "Unattractive (Level 3)")) {
			mod -= 5;
		}
	}
	if (this.checked) {
		if (!checkTraitReqs(type, name, source, false)){
			this.checked = false;
		} else {
			purchaseTrait(type, name, source, mod, false);
		}
	} else {
		removeTrait(type, name, source, mod, false);
	}
	updateCP();
}
	
function saveSection(section) { // Validate and save data
	var temp, tempArray = [], tempArray2 = [], tempList = {}, invalid = 0, i, j, morphName, morphType, found, error = false;
	// Check CP
	if (myCharacter.CP < 0) {
		alert("You do not have enough CP.");
		return 0;
	}
	if (myCharacter.CPSpentOnPositiveTraits > 50) {
		alert("You may not spend more than 50 CP on positive traits.");
		return 0;
	}
	if (myCharacter.CPGainedFromNegativeTraits > 50) {
		alert("You may not purchase more than 50 CP worth of negative traits.");
		return 0;
	}
	if (section === "ConceptSection") {
		// Name and Concept
		myCharacter.name = document.getElementById("charName").value;
		myCharacter.concept = document.getElementById("concept").value;
	}
	if (section === "BackgroundSection") {
		// Background
		// Enforce specific fields as required in Background descriptions
		if (backgroundData[document.getElementById("bg").value].getElementsByTagName("name")[0].childNodes[0].nodeValue === "Original Space Colonist") {
			if (skillData[document.getElementById("bgChoice1").value].getElementsByTagName("name")[0].childNodes[0].nodeValue === "Pilot") {
				document.getElementById("bgChoice1Field").value = "Spacecraft";
			}
		}
		tempList = {};
		for (i = 1; i <= bgChoices; i++) {
			// Check if skill requires a field
			if (skillData[document.getElementById("bgChoice" + i).value].getElementsByTagName("fields")[0].childNodes[0].nodeValue === "Yes") {
				if (document.getElementById("bgChoice" + i + "Field").value === "") {
					alert("One of your selected skills requires a field.");
					error = true;
					return 0;
				}
			} else { // Clear the field if not required
				document.getElementById("bgChoice" + i + "Field").value = "";
			}
			// Check for duplicate skill selections
			if (tempList.hasOwnProperty("skill" + document.getElementById("bgChoice" + i).value)) {
				if (tempList["skill" + document.getElementById("bgChoice" + i).value].hasOwnProperty("field" + document.getElementById("bgChoice" + i + "Field").value)) {
					alert("You may not select the same skill twice.");
					return 0;
				} else {
					tempList["skill" + document.getElementById("bgChoice" + i).value]["field" + document.getElementById("bgChoice" + i + "Field").value] = 1;
				}
			} else {
				tempList["skill" + document.getElementById("bgChoice" + i).value] = {};
				tempList["skill" + document.getElementById("bgChoice" + i).value]["field" + document.getElementById("bgChoice" + i + "Field").value] = 1;
			}
		}
		removeTemplate("background");
		myCharacter.ego.background = document.getElementById("bg").value;
		applyTemplate("background");
	}
	if (section === "FactionSection") {
		// Faction
		tempList = {};
		for (i = 1; i <= facChoices; i++) {
			// Check if skill requires a field
			if (skillData[document.getElementById("facChoice" + i).value].getElementsByTagName("fields")[0].childNodes[0].nodeValue === "Yes") {
				if (document.getElementById("facChoice" + i + "Field").value === "") {
					alert("One of your selected skills requires a field.");
					return 0;
				}
			} else { // Clear the field if not required
				document.getElementById("facChoice" + i + "Field").value = "";
			}
			// Check for duplicate skill selections
			if (tempList.hasOwnProperty("skill" + document.getElementById("facChoice" + i).value)) {
				if (tempList["skill" + document.getElementById("facChoice" + i).value].hasOwnProperty("field" + document.getElementById("facChoice" + i + "Field").value)) {
					alert("You may not select the same skill twice.");
					return 0;
				} else {
					tempList["skill" + document.getElementById("facChoice" + i).value]["field" + document.getElementById("facChoice" + i + "Field").value] = 1;
				}
			} else {
				tempList["skill" + document.getElementById("facChoice" + i).value] = {};
				tempList["skill" + document.getElementById("facChoice" + i).value]["field" + document.getElementById("facChoice" + i + "Field").value] = 1;
			}
		}
		removeTemplate("faction");
		myCharacter.ego.faction = parseInt(document.getElementById("fac").value, 10);
		applyTemplate("faction");
	}
	if (section === "AptitudesFreePointsSection") {
		// Aptitudes
		// Check free points spent
		if (parseInt(document.getElementById("remainingAptPts").innerHTML, 10) > 0) {
			alert("You have not assigned all of your free Attribute Points.");
			return 0;
		}
		if (parseInt(document.getElementById("remainingAptPts").innerHTML, 10) < 0) {
			alert("You have assigned too many free Attribute Points.");
			return 0;
		}
		// Check for Feeble trait compliance
		if ((document.getElementById("traitFeebleEgo").checked) && (document.getElementById("start" + document.getElementById("traitFeebleEgoChoice").value).value > 4)) {
			alert("You must purchase the aptitude specified by the Feeble trait at a rating lower than 5.");
			return 0;
		}
		// Check for max and min value compliance
		for (i = 1; i <= 7; i++) {
			temp = "";
			switch (i) {
			case 1:
				temp = "COG";
				break;
			case 2:
				temp = "COO";
				break;
			case 3:
				temp = "INT";
				break;
			case 4:
				temp = "REF";
				break;
			case 5:
				temp = "SAV";
				break;
			case 6:
				temp = "SOM";
				break;
			case 7:
				temp = "WIL";
				break;
			default:
				return 1;
			}
			// Check for max
			if ((parseInt(document.getElementById("start" + temp).value, 10) > 30) && ((!document.getElementById("traitExceptional AptitudeEgo").checked) || (document.getElementById("traitExceptional AptitudeEgoChoice").value !== temp))) {
				alert("No aptitude my be raised above 30 unless you take the Exceptional Aptitude trait for it.");
				return 0;
			}
			// Check for min
			if ((parseInt(document.getElementById("start" + temp).value, 10) < 5) && ((!document.getElementById("traitFeebleEgo").checked) || (document.getElementById("traitFeebleEgoChoice").value !== temp))) {
				alert("No aptitude my be lowered below 5 unless you take the Feeble trait for it.");
				return 0;
			}
			// Save the value
			myCharacter.ego[temp] = parseInt(document.getElementById("start" + temp).value, 10);
		}
	}
	if (section === "PsiSleightsSection") {
		if ((myCharacter.ego.psiSleights["totalGamma"] > 5) || (myCharacter.ego.psiSleights["totalChi"] > 5)) {
			alert("No more than 5 psi-chi and 5 psi-gamma sleights may be bought during character creation.");
			return 0;
		}
	}
	if (section === "RepFreePointsSection") {
		// Rep
		if (parseInt(document.getElementById("remainingRepPts").innerHTML, 10) > 0) {
			alert("You have not assigned all of your Rep Points.");
			return 0;
		}
		if (parseInt(document.getElementById("remainingRepPts").innerHTML, 10) < 0) {
			alert("You have assigned too many Rep Points.");
			return 0;
		}
		// Ensure rep selected for Blacklisted trait (if checked) is set to 0.
		if ((document.getElementById("traitBlacklistedEgo").checked) && (parseInt(document.getElementById("start" + document.getElementById("traitBlacklistedChoice").value).value, 10) !== 0)) {
			alert("You may not have a Rep score higher than 0 in your Blacklisted selection.");
			return 0;
		}
		myCharacter.ego.reputations.ARep = parseInt(document.getElementById("startARep").value, 10);
		myCharacter.ego.reputations.CRep = parseInt(document.getElementById("startCRep").value, 10);
		myCharacter.ego.reputations.ERep = parseInt(document.getElementById("startERep").value, 10);
		myCharacter.ego.reputations.FRep = parseInt(document.getElementById("startFRep").value, 10);
		myCharacter.ego.reputations.GRep = parseInt(document.getElementById("startGRep").value, 10);
		myCharacter.ego.reputations.IRep = parseInt(document.getElementById("startIRep").value, 10);
		myCharacter.ego.reputations.RRep = parseInt(document.getElementById("startRRep").value, 10);
	}
	if (section === "MorphSection") {
		// Morph
		tempList = {};
		// Check aptitude bonus selections
		for (i = 1; i <= morphChoices; i++) {
			if (tempList.hasOwnProperty(document.getElementById("morphChoice" + i).value)) {
				alert("You cannot select the same aptitude twice.");
				return 0;
			} else {
				tempList[document.getElementById("morphChoice" + i).value] = 1;
			}
		}
		// Check CP
		if (myCharacter.CPGainedFromNegativeMorphTraits > 25) {
		alert("You may not purchase more than 25 CP worth of negative morph traits.");
		return 0;
		}
		// Check for Second Skin trait - this overrides any further validity checks
		if (!document.getElementById("traitSecond SkinEgo").checked) {
			morphName = morphData[document.getElementById("morph").value].getElementsByTagName("name")[0].childNodes[0].nodeValue;
			morphType = morphData[document.getElementById("morph").value].getElementsByTagName("type")[0].childNodes[0].nodeValue;
			// Check for background required morphs
			found = (backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph").length < 1) ? 1 : 0;
			for (i = 0; i < backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph").length; i++) {
				if ((backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph")[i].childNodes[0].nodeValue === morphName) || (backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph")[i].childNodes[0].nodeValue === morphType)) {
					found = 1;
				}
			}
			if (!found) {
				alert("Your background requires a different morph than the one you selected.");
				return 0;
			}
			// Check for faction required morphs
			found = (factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph").length < 1) ? 1 : 0;
			for (i = 0; i < factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph").length; i++) {
				if ((factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph")[i].childNodes[0].nodeValue === morphName) || (factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph")[i].childNodes[0].nodeValue === morphType)) {
					found = 1;
				}
			}
			if (!found) {
				alert("Your faction requires a different morph than the one you selected.");
				return 0;
			}
			// Check for background morph restrictions
			for (i = 0; i < backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph").length; i++) {
				if ((backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph")[i].childNodes[0].nodeValue === morphName) || (backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph")[i].childNodes[0].nodeValue === morphType)) {
					invalid = 1;
				}
			}
			if (invalid) {
				alert("Your background does not permit the morph you selected.");
				return 0;
			}
			// Check for faction morph restrictions
			for (i = 0; i < factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph").length; i++) {
				if ((factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph")[i].childNodes[0].nodeValue === morphName) || (factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph")[i].childNodes[0].nodeValue === morphType)) {
					invalid = 1;
				}
			}
			if (invalid) {
				alert("Your faction does not permit the morph you selected.");
				return 0;
			}
		}
		myCharacter.morph.ID = parseInt(document.getElementById("morph").value, 10);
		document.getElementById("negativeMorphTraitsCPdiv").style.display = "none";
		document.getElementById("fixeddiv").style.height = "75";
	}
	if (section === "SkillsSection") {
		// Learned Skills
			// Check CP
		if (myCharacter.CPSpentOnActiveSkills < 400) {
			alert("You must must purchase a minimum of 400 CP of Active skills.");
			return 0;
		}
		if (myCharacter.CPSpentOnKnowledgeSkills < 300) {
			alert("You must must purchase a minimum of 400 CP of Active skills.");
			return 0;
		}
		// Check Incompetent trait
		if ((document.getElementById("traitIncompetentEgo").checked) && (parseInt(document.getElementById("skill" + document.getElementById("traitIncompetentChoice").value + "field1purchased").value, 10) !== 0)){
			alert("You may not buy the skill selected for the Incompetent trait.");
			return 0;
		}
		// Check and store data
		myCharacter.ego.skills = [];
		i = 0;
		while (document.getElementById("skill" + i + "field1total") !== null) {
			myCharacter.ego.skills[i] = {};
			myCharacter.ego.skills[i].field = {};
			j = 1;
			while (document.getElementById("skill" + i + "field" + j + "total") !== null) {
				// One last check for blank field with purchased amount. This can happen if a user deletes the text in the field after purchasing ranks.
				if ((document.getElementById("skill" + i + "field" + j + "input") !== null) && (document.getElementById("skill" + i + "field" + j + "input").value.replace(/^\s+|\s+$/g, '') === "") && (parseInt(document.getElementById("skill" + i + "field" + j + "purchased").value, 10) !== 0)) {
					alert("You may not purchase a blank field.");
					return 0;
				}
				// Skip entries with blank fields
				if ((document.getElementById("skill" + i + "field" + j + "input") !== null) && (document.getElementById("skill" + i + "field" + j + "input").value !== "")) {
					if ((parseInt(document.getElementById("skill" + i + "field" + j + "purchased").value, 10) !== 0) && (parseInt(document.getElementById("skill" + i + "field" + j + "total").innerHTML, 10) > 80)) {
						// Only allow over 80 if Expert Trait is checked, the skill matches, and either there is no field or the fields match too
						if (((!document.getElementById("traitExpertEgo").checked) || (parseInt(document.getElementById("traitExpertChoice").value, 10) !== i)) || ((document.getElementById("skill" + i + "field" + j + "input") !== null) && (document.getElementById("skill" + i + "field" + j + "input").value !== document.getElementById("traitExpertField").value))) {
							alert("No learned skill may be raised over 80 during character creation (unless you have the Expert trait for that skill).");
							return 0;
						} else if (parseInt(document.getElementById("skill" + i + "field" + j + "total").innerHTML, 10) > 90) {
							alert("No learned skill may be raised over 90 during character creation.");
							return 0;
						}
					}
					if (document.getElementById("skill" + i + "field" + j + "input") === null) {
						temp = "none";
					} else {
						temp = document.getElementById("skill" + i + "field" + j + "input").value;
					}
					 // Check for duplicates
					if (myCharacter.ego.skills[i].field.hasOwnProperty(temp)) {
						alert("You may not purchase the same skill-field twice.");
						return 0;
					}
					// Everything checks out so far
					myCharacter.ego.skills[i].field[temp] = {};
					myCharacter.ego.skills[i].field[temp].total = parseInt(document.getElementById("skill" + i + "field" + j + "amount").innerHTML, 10) + parseInt(document.getElementById("skill" + i + "field" + j + "purchased").value, 10);
					// Apply -10 if incompetent
					if ((document.getElementById("traitIncompetentEgo").checked) && (parseInt(document.getElementById("traitIncompetentChoice").value, 10) === i)) {
						myCharacter.ego.skills[i].field[temp].total -= 10;
					}
					// Save specialization if present
					if (document.getElementById("skill" + i + "field" + j + "specbox").checked){
						myCharacter.ego.skills[i].field[temp].specialization = document.getElementById("skill" + i + "field" + j + "spectext").value;
						// Make sure a specialization was selected
						if (myCharacter.ego.skills[i].field[temp].specialization.replace(/^\s+|\s+$/g, '') === ""){
							alert("You must name a specialization when purchased.");
							return 0;
						}
					}
				}
				j++;
			}
			i++;
		}
	}
	if (section === "MiscCPSection") {
	}
	return 1;
}

function setupSection(section) {
	var output, i, q, j, field, flag, type, name, category, skillID, output, temp, temp2, tempData, maxVal, maxCP, costPer, multiplier, newCost, oldCost, newValue, oldValue, newTotal, baseValue, statName;
	if (section === "MorphSection") {
		output = "None";
		// Load background restrictions
		if (backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph").length !== 0) {
			output = "";
			for (i = 0; i < backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph").length; i++) {
				output += "Required Morph (";
				output += backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph")[i].childNodes[0].nodeValue + ")";
				if ((i + 1) !== backgroundData[myCharacter.ego.background].getElementsByTagName("requiredmorph").length) {
					output += ", ";
				}
			}
		}
		if (backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph").length !== 0) {
			if (output === "None") {
				output = "";
			} else {
				output += ", ";
			}
			for (i = 0; i < backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph").length; i++) {
				output += "Restricted Morph (";
				output += backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph")[i].childNodes[0].nodeValue + ")";
				if ((i + 1) !== backgroundData[myCharacter.ego.background].getElementsByTagName("restrictedmorph").length) {
					output += ", ";
				}
			}
		}
		document.getElementById("morphBGRestrictions").innerHTML = output;
		// Load faction restrictions
		output = "None";
		if (factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph").length !== 0) {
			output = "";
			for (i = 0; i < factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph").length; i++) {
				output += "Required Morph (";
				output += factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph")[i].childNodes[0].nodeValue + ")";
				if ((i + 1) !== factionData[myCharacter.ego.faction].getElementsByTagName("requiredmorph").length) {
					output += ", ";
				}
			}
		}
		if (factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph").length !== 0) {
			if (output === "None") {
				output = "";
			} else {
				output += ", ";
			}
			for (i = 0; i < factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph").length; i++) {
				output += "Restricted Morph (";
				output += factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph")[i].childNodes[0].nodeValue + ")";
				if ((i + 1) !== factionData[myCharacter.ego.faction].getElementsByTagName("restrictedmorph").length) {
					output += ", ";
				}
			}
		}
		document.getElementById("morphFacRestrictions").innerHTML = output;
	}
	if (section === "RepFreePointsSection") {
		myCharacter.ego.reputations.total = 50;
		// Load background and faction reputation data
		for (i = 0; i < factionData[myCharacter.ego.faction].getElementsByTagName("statmod").length; i++) {
			if (factionData[myCharacter.ego.faction].getElementsByTagName("statmod")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === "REP") {
				myCharacter.ego.reputations.total += parseInt(factionData[myCharacter.ego.faction].getElementsByTagName("statmod")[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
			}
		}
		for (i = 0; i < backgroundData[myCharacter.ego.background].getElementsByTagName("statmod").length; i++) {
			if (backgroundData[myCharacter.ego.background].getElementsByTagName("statmod")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === "REP") {
				myCharacter.ego.reputations.total += parseInt(backgroundData[myCharacter.ego.background].getElementsByTagName("statmod")[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
			}
		}
		updateStartRep();
	}
	if (section === "SkillsSection") {
		// Reset skills data
		myCharacter.ego.skills = [];
		for (i = 0; i < skillData.length; i++) {
			myCharacter.ego.skills[i] = {};
			myCharacter.ego.skills[i].field = {};
			myCharacter.ego.skills[i].field.none = {};
			myCharacter.ego.skills[i].field.none.mod = 0;
		}
		// All characters get +70 to their natural language for free
		skillID = lookupSkillID("Language");
		myCharacter.ego.skills[skillID].field.Natural = {};
		myCharacter.ego.skills[skillID].field.Natural.mod = 70;
		// Refund and reset CP
		myCharacter.CP += myCharacter.CPSpentOnKnowledgeSkills + myCharacter.CPSpentOnActiveSkills;
		myCharacter.CPSpentOnKnowledgeSkills = 0;
		myCharacter.CPSpentOnActiveSkills = 0;
		// Load background and faction skill data
		for (j = 0; j < 2; j++) {
			tempData = (j === 0) ? backgroundData[myCharacter.ego.background].getElementsByTagName("skillmod") : factionData[myCharacter.ego.faction].getElementsByTagName("skillmod");
			for (i = 0; i < tempData.length; i++) {
				if ((tempData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue !== "Choice") && (tempData[i].getElementsByTagName("amount").length !== 0)) {
					skillID = lookupSkillID(tempData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue);
					if (tempData[i].getElementsByTagName("field").length !== 0) {
						// Check if the field already exists. If not, create it.
						if (myCharacter.ego.skills[skillID].field.hasOwnProperty(tempData[i].getElementsByTagName("field")[0].childNodes[0].nodeValue)) {
							myCharacter.ego.skills[skillID].field[tempData[i].getElementsByTagName("field")[0].childNodes[0].nodeValue].mod = parseInt(tempData[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
						} else {
							myCharacter.ego.skills[skillID].field[tempData[i].getElementsByTagName("field")[0].childNodes[0].nodeValue] = {};
							myCharacter.ego.skills[skillID].field[tempData[i].getElementsByTagName("field")[0].childNodes[0].nodeValue].mod = parseInt(tempData[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
						}
					} else {
						myCharacter.ego.skills[skillID].field.none.mod = parseInt(tempData[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10);
					}
				}
			}
			// Load skill choices data
			temp = (j === 0) ? "bg" : "fac";
			temp2 = (j === 0) ? bgChoices : facChoices;
			for (i = 1; i <= temp2; i++) {
				if (document.getElementById(temp + "Choice" + i + "Field").value === "") {
					myCharacter.ego.skills[document.getElementById(temp + "Choice" + i).value].field.none.mod += parseInt(document.getElementById(temp + "Choice" + i + "Amount").innerHTML, 10);
				} else {
					// Check if the field already exists. If not, create it.
					if (myCharacter.ego.skills[document.getElementById(temp + "Choice" + i).value].field.hasOwnProperty(document.getElementById(temp + "Choice" + i + "Field").value)) {
						myCharacter.ego.skills[document.getElementById(temp + "Choice" + i).value].field[document.getElementById(temp + "Choice" + i + "Field").value].mod += parseInt(document.getElementById(temp + "Choice" + i + "Amount").innerHTML, 10);
					} else {	
						myCharacter.ego.skills[document.getElementById(temp + "Choice" + i).value].field[document.getElementById(temp + "Choice" + i + "Field").value] = {};
						myCharacter.ego.skills[document.getElementById(temp + "Choice" + i).value].field[document.getElementById(temp + "Choice" + i + "Field").value].mod = parseInt(document.getElementById(temp + "Choice" + i + "Amount").innerHTML, 10);
					}
				}
			}
		}
		// Assemble skills output
		for (q = 0; q < 2; q++) {
			category = (q === 0) ? "Active" : "Knowledge";
			output = "<table><tr><td><b>Skill Name<\/b><\/td><td><b>Field<\/b><\/td><td><b>Aptitude<\/b><\/td><td><b>Mods<\/b><\/td><td><b>Base<\/b><\/td><td><b>Purchased<\/b><\/td><td><b>Total<\/b><\/td><td><b>Cost<\/b><\/td><td><b><\/b><\/td><td><b>Specialization<\/b><\/td><\/tr>";
			for (i = 0; i < myCharacter.ego.skills.length; i++) {
				field = 1;
				flag = 0;
				for (j = 0; j < skillData[i].getElementsByTagName("category").length; j++) {
					if (skillData[i].getElementsByTagName("category")[j].childNodes[0].nodeValue === category) {
						flag = 1;
					}
				}
				if (flag) {
					for (j in myCharacter.ego.skills[i].field) {
						if (myCharacter.ego.skills[i].field.hasOwnProperty(j)) {
							if ((j !== "none") || (skillData[i].getElementsByTagName("fields")[0].childNodes[0].nodeValue === "No")) { // Skip the "none"s in skills with fields
								output += "<tr><td>" + skillData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue + "<\/td>"; // Name
								if (j === "none") {
									output += "<td>-<\/td>"; // Leave Field blank
								} else {
									output += "<td><input id=\"skill" + i + "field" + field + "input\" type=\"text\" maxlength=\"20\" value=\"" + j + "\" disabled=\"true\" /><\/td>"; // Field
								}
								output += "<td>" + skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue + " (" + myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue] + ")<\/td>"; // Linked Apt
								output += "<td id=\"skill" + i + "field" + field + "amount\">" + myCharacter.ego.skills[i].field[j].mod + "<\/td>"; // Mods
								output += "<td id=\"skill" + i + "field" + field + "base\">" + (parseInt(myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue], 10) + myCharacter.ego.skills[i].field[j].mod) + "<\/td>"; // Base
								output += "<td><input id=\"skill" + i + "field" + field + "purchased\" type=\"text\" maxlength=\"2\" value=\"0\" onChange=\"updateSkill(" + i + "," + field + ",'" + category + "')\" /><\/td>"; // Amount purchased
								output += "<td id=\"skill" + i + "field" + field + "total\">" + (parseInt(myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue], 10) + myCharacter.ego.skills[i].field[j].mod) + "<\/td>"; // Total
								output += "<td id=\"skill" + i + "field" + field + "cost\">0<\/td>"; // CP Cost
								temp = ((parseInt(myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue], 10) + myCharacter.ego.skills[i].field[j].mod) >= 30) ? "":" disabled " ;
								output += "<td><input id=\"skill" + i + "field" + field + "specbox\" type=\"checkbox\" onclick=\"toggleSpec(" + i + "," + field + ")\"" + temp + "/></td>"; // Spec Checkbox
								output += "<td><input id=\"skill" + i + "field" + field + "spectext\" type=\"text\" maxlength=\"20\" disabled=\"true\" /></td><\/tr>"; // Spec field
								field++;
							}
						}
					}
					// Provide three extra slots for skills with fields
					if (skillData[i].getElementsByTagName("fields")[0].childNodes[0].nodeValue === "Yes") {
						for (j = 0; j < 3; j++) {
							output += "<tr><td>" + skillData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue + "<\/td>"; // Name
							output += "<td><input id=\"skill" + i + "field" + field + "input\" type=\"text\" maxlength=\"20\" /><\/td>"; // Field
							output += "<td>" + skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue + " (" + myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue] + ")<\/td>"; // Linked Apt
							output += "<td id=\"skill" + i + "field" + field + "amount\">0<\/td>"; // Mods
							output += "<td id=\"skill" + i + "field" + field + "base\">" + myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue] + "<\/td>"; // Base
							output += "<td><input id=\"skill" + i + "field" + field + "purchased\" type=\"text\" maxlength=\"2\" value=\"0\" onChange=\"updateSkill(" + i + "," + field + ",'" + category + "')\" /><\/td>"; // Amount purchased
							output += "<td id=\"skill" + i + "field" + field + "total\">" + myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue] + "<\/td>"; // Total
							output += "<td id=\"skill" + i + "field" + field + "cost\">0<\/td>"; // CP Cost
							temp = (parseInt(myCharacter.ego[skillData[i].getElementsByTagName("apt")[0].childNodes[0].nodeValue], 10) >= 30) ? "":" disabled " ;
							output += "<td><input id=\"skill" + i + "field" + field + "specbox\" type=\"checkbox\" onclick=\"toggleSpec(" + i + "," + field + ")\"" + temp + "/></td>"; // Spec Checkbox
							output += "<td><input id=\"skill" + i + "field" + field + "spectext\" type=\"text\" maxlength=\"20\" disabled=\"true\" /></td><\/tr>"; // Spec field
							field++;
						}
					}
				}
			}
			output += "<\/table>";
			document.getElementById(category + "Skills").innerHTML = output;
		}
	}
	if (section === "MiscCPSection") {
		for (i = 1; i <= 16; i++) {
			switch (i) {
			case 1:
				type = "Stat";
				name = "Moxie";
				baseValue = myCharacter.ego.MOX;
				break;
			case 2:
				type = "Stat";
				name = "Credit";
				baseValue = myCharacter.ego.CRED;
				break;
			case 3:
				type = "Apt";
				name = "COG";
				baseValue = myCharacter.ego.COG;
				break;
			case 4:
				type = "Apt";
				name = "COO";
				baseValue = myCharacter.ego.COO;
				break;
			case 5:
				type = "Apt";
				name = "INT";
				baseValue = myCharacter.ego.INT;
				break;
			case 6:
				type = "Apt";
				name = "REF";
				baseValue = myCharacter.ego.REF;
				break;
			case 7:
				type = "Apt";
				name = "SAV";
				baseValue = myCharacter.ego.SAV;
				break;
			case 8:
				type = "Apt";
				name = "SOM";
				baseValue = myCharacter.ego.SOM;
				break;
			case 9:
				type = "Apt";
				name = "WIL";
				baseValue = myCharacter.ego.WIL;
				break;
			case 10:
				type = "Rep";
				name = "The @-list";
				baseValue = myCharacter.ego.reputations.ARep;
				break;
			case 11:
				type = "Rep";
				name = "CivicNet";
				baseValue = myCharacter.ego.reputations.CRep;
				break;
			case 12:
				type = "Rep";
				name = "EcoWave";
				baseValue = myCharacter.ego.reputations.ERep;
				break;
			case 13:
				type = "Rep";
				name = "Fame";
				baseValue = myCharacter.ego.reputations.FRep;
				break;
			case 14:
				type = "Rep";
				name = "Guanxi";
				baseValue = myCharacter.ego.reputations.GRep;
				break;
			case 15:
				type = "Rep";
				name = "The Eye";
				baseValue = myCharacter.ego.reputations.IRep;
				break;
			case 16:
				type = "Rep";
				name = "RNA";
				baseValue = myCharacter.ego.reputations.RRep;
				break;
			default:
				type = "";
				name = "";
				cost = "";
				baseValue = 0;
			}
			maxVal = 999999;
			maxCP = 999999;
			costPer = 1;
			multiplier = 1;
			statName = "";
			if (type === "Stat") {
				switch (name) {
				case "Credit":
					multiplier = 1000;
					maxCP = 100;
					break;
				case "Moxie":
					costPer = 15;
					maxVal = 10;
					break;
				default:
				 alert("Unknown stat " + name + ".");
				}
			}
			if (type === "Apt") {
				costPer = 10;
				maxVal = 30;
				// Check exceptional aptitude trait
				if ((document.getElementById("traitExceptional AptitudeEgo").checked) && (document.getElementById("traitExceptional AptitudeEgoChoice").value === name)) {
					maxVal = 40;
				}
				// Check feeble trait
				if ((document.getElementById("traitFeebleEgo").checked) && (document.getElementById("traitFeebleEgoChoice").value === name)) {
					maxVal = 4;
				}
			}
			if (type === "Rep") {
				multiplier = 10;
				maxVal = 80;
				maxCP = 35;
				switch (name) {
				case "The @-list":
					statName = "ARep";
					break;
				case "CivicNet":
					statName = "CRep";
					break;
				case "EcoWave":
					statName = "ERep";
					break;
				case "Fame":
					statName = "FRep";
					break;
				case "Guanxi":
					statName = "GRep";
					break;
				case "The Eye":
					statName = "IRep";
					break;
				case "RNA":
					statName = "RRep";
					break;	
				default:
					alert("Unknown rep " + name + ".");
				}
			}
			document.getElementById("misc" + type + name + "Base").innerHTML = baseValue;
			oldValue = parseInt(document.getElementById("misc" + type + name + "Value").innerHTML, 10);
			newValue = oldValue;
			oldCost = parseInt(document.getElementById("misc" + type + name + "Cost").innerHTML, 10);
			newTotal = oldValue + baseValue;
			newCost = newValue / multiplier * costPer;
			// Reset to 0 and refund CP if new value  or cost is out of bounds or invalidated by blacklisted trait
			if ((newTotal < 0) || (newTotal > maxVal) || (newCost > maxCP) || ((document.getElementById("traitBlacklistedEgo").checked) && (document.getElementById("traitBlacklistedChoice").value === statName))) {
				newValue = 0;
				newCost = 0;
				document.getElementById("misc" + type + name + "Value").innerHTML = 0;
			}
			myCharacter.CP -= newCost - oldCost;
			document.getElementById("misc" + type + name + "Cost").innerHTML = newCost;
			document.getElementById("misc" + type + name + "TotalValue").innerHTML = newTotal;
		}
	}
	return 1;
}

function selectBG() {
	var output, i, j, k, l, m, quantity, numChoices, value, skillName, num;
	num = parseInt(document.getElementById("bg").value, 10);
	// Assemble background descriptive text
	output = "<b>Description:<\/b> ";
	output += backgroundData[num].getElementsByTagName("description")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Advantages:<\/b> ";
	output += backgroundData[num].getElementsByTagName("advantages")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Disadvantages:<\/b> ";
	output += backgroundData[num].getElementsByTagName("disadvantages")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Common Morphs:<\/b> ";
	output += backgroundData[num].getElementsByTagName("commonmorphs")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	document.getElementById("bgDescription").innerHTML = output;
	// Assemble background skill choices
	output = "";
	bgChoices = 0;
	for (i = 0; i < backgroundData[num].getElementsByTagName("skillmod").length; i++) {
		if (backgroundData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === "Choice") {
			quantity = (backgroundData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("quantity").length !== 0) ? backgroundData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("quantity")[0].childNodes[0].nodeValue : 1;
			for (j = 0; j < quantity; j++) {
				bgChoices++;
				output += "+<font id=\"bgChoice" + bgChoices + "Amount\">" + backgroundData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue + "<\/font> to ";
				output += "<select id=\"bgChoice" + bgChoices + "\">";
				numChoices = backgroundData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("choice").length;
				value = 0;
				for (k = 0; k < numChoices; k++) {
					skillName = backgroundData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("choice")[k].childNodes[0].nodeValue;
					// Assemble list of all skills?
					if (skillName === "Any") {
						for (l = 0; l < skillData.length; l++) {
							output += "<option value=\"" + l + "\">" + skillData[l].getElementsByTagName("name")[0].childNodes[0].nodeValue;
							value++;
						} // Assemble list of all skills of a certain category?
					} else if ((skillName === "Active") || (skillName === "Combat") || (skillName === "Knowledge") || (skillName === "Mental") || (skillName === "Physical") || (skillName === "Psi") || (skillName === "Technical") || (skillName === "Weapon")) {
						for (l = 0; l < skillData.length; l++) {
							for (m = 0; m < skillData[l].getElementsByTagName("category").length; m++) {
								if (skillData[l].getElementsByTagName("category")[m].childNodes[0].nodeValue === skillName) {
									output += "<option value=\"" + l + "\">" + skillData[l].getElementsByTagName("name")[0].childNodes[0].nodeValue;
									value++;
									m = skillData[l].getElementsByTagName("category").length;
								}
							}
						}
					} else { // Default, select a specific skill
						for (l = 0; l < skillData.length; l++) {
							if (skillData[l].getElementsByTagName("name")[0].childNodes[0].nodeValue === skillName) {
								value = l;
							}
						}
						output += "<option value=\"" + value + "\">" + skillName;
					}
				}
				output += "<\/select>";
				output += " Field (if applicable): <input type=\"text\" id=\"bgChoice" + bgChoices + "Field\" maxlength=\"20\" value=\"\"/>";
				output += "<br />";
			}
		}
	}
	document.getElementById("bgOptions").innerHTML = output;
}

function selectFac() {
	var output = "", i, j, k, l, m, quantity, numChoices, value, skillName, num;
	num = parseInt(document.getElementById("fac").value, 10);
	// Assemble new faction descriptive text
	output += "<b>Description:<\/b> ";
	output += factionData[num].getElementsByTagName("description")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Advantages:<\/b> ";
	output += factionData[num].getElementsByTagName("advantages")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Disadvantages:<\/b> ";
	output += factionData[num].getElementsByTagName("disadvantages")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Common Morphs:<\/b> ";
	output += factionData[num].getElementsByTagName("commonmorphs")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	document.getElementById("facDescription").innerHTML = output;
	// Assemble faction skill choices
	output = "";
	facChoices = 0;
	for (i = 0; i < factionData[num].getElementsByTagName("skillmod").length; i++) {
		if (factionData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === "Choice") {
			quantity = (factionData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("quantity").length !== 0) ? factionData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("quantity")[0].childNodes[0].nodeValue : 1;
			for (j = 0; j < quantity; j++) {
				facChoices++;
				output += "+<font id=\"facChoice" + facChoices + "Amount\">" + factionData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue + "<\/font> to ";
				output += "<select id=\"facChoice" + facChoices + "\">";
				numChoices = factionData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("choice").length;
				value = 0;
				for (k = 0; k < numChoices; k++) {
					skillName = factionData[num].getElementsByTagName("skillmod")[i].getElementsByTagName("choice")[k].childNodes[0].nodeValue;
					// Assemble list of all skills?
					if (skillName === "Any") {
						for (l = 0; l < skillData.length; l++) {
							output += "<option value=\"" + l + "\">" + skillData[l].getElementsByTagName("name")[0].childNodes[0].nodeValue;
							value++;
						} // Assemble list of all skills of a certain category?
					} else if ((skillName === "Active") || (skillName === "Combat") || (skillName === "Knowledge") || (skillName === "Mental") || (skillName === "Physical") || (skillName === "Psi") || (skillName === "Technical") || (skillName === "Weapon")) {
						for (l = 0; l < skillData.length; l++) {
							for (m = 0; m < skillData[l].getElementsByTagName("category").length; m++) {
								if (skillData[l].getElementsByTagName("category")[m].childNodes[0].nodeValue === skillName) {
									output += "<option value=\"" + l + "\">" + skillData[l].getElementsByTagName("name")[0].childNodes[0].nodeValue;
									value++;
									m = skillData[l].getElementsByTagName("category").length;
								}
							}
						}
					} else { // Default, select a specific skill
						for (l = 0; l < skillData.length; l++) {
							if (skillData[l].getElementsByTagName("name")[0].childNodes[0].nodeValue === skillName) {
								value = l;
							}
						}
						output += "<option value=\"" + value + "\">" + skillName;
					}
				}
				output += "<\/select>";
				// Provide a text box for fields
				output += " Field (if applicable): <input type=\"text\" id=\"facChoice" + facChoices + "Field\" maxlength=\"20\" value=\"\"/>";
				output += "<br />";
			}
		}
	}
	document.getElementById("facOptions").innerHTML = output;
}	

function selectMorph() {
	var num, i, j, k, output, quantity, numChoices, aptName, temp;
	num = parseInt(document.getElementById("morph").value, 10);
	// Refund and charge CP
	myCharacter.CP += parseInt(morphData[myCharacter.morph.temp].getElementsByTagName("CPCost")[0].childNodes[0].nodeValue, 10);
	myCharacter.morph.temp = parseInt(document.getElementById("morph").value, 10);
	myCharacter.CP -= parseInt(morphData[myCharacter.morph.temp].getElementsByTagName("CPCost")[0].childNodes[0].nodeValue, 10);
	// Assemble morph descriptive text
	output = "";
	output += "<b>Description:<\/b> ";
	output += morphData[num].getElementsByTagName("description")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Type:<\/b> ";
	output += morphData[num].getElementsByTagName("type")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Implants/Enhancements:<\/b> ";
	output += morphData[num].getElementsByTagName("implants")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	if (morphData[num].getElementsByTagName("mobility").length !== 0) {
		output += "<b>Mobility:<\/b> ";
		for (i = 0; i < morphData[num].getElementsByTagName("mobility").length; i++) {
			output += morphData[num].getElementsByTagName("mobility")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue + " ";
			output += "(" + morphData[num].getElementsByTagName("mobility")[i].getElementsByTagName("walk")[0].childNodes[0].nodeValue + "/";
			output += morphData[num].getElementsByTagName("mobility")[i].getElementsByTagName("run")[0].childNodes[0].nodeValue + ")";
			if ((i + 1) !== morphData[num].getElementsByTagName("mobility").length) {
				output += ", ";
			}
		}
		output += "<br />";
	}
	output += "<b>Aptitude Maximum:<\/b> ";
	output += morphData[num].getElementsByTagName("aptitudeMax")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Durability:<\/b> ";
	output += morphData[num].getElementsByTagName("durability")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Wound Threshold:<\/b> ";
	output += morphData[num].getElementsByTagName("woundThreshold")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Advantages:<\/b> ";
	output += morphData[num].getElementsByTagName("advantages")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Disadvantages:<\/b> ";
	output += morphData[num].getElementsByTagName("disadvantages")[0].getElementsByTagName("text")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>CP Cost:<\/b> ";
	output += morphData[num].getElementsByTagName("CPCost")[0].childNodes[0].nodeValue + "<br />";
	output += "<b>Credit Cost:<\/b> ";
	output += morphData[num].getElementsByTagName("creditCost")[0].childNodes[0].nodeValue + "<br />";
	document.getElementById("morphDescription").innerHTML = output;
	// Assemble morph aptitude choices
	output = "";
	morphChoices = 0;
	for (i = 0; i < morphData[num].getElementsByTagName("aptmod").length; i++) {
		if (morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("name")[0].childNodes[0].nodeValue === "Choice") {
			quantity = (morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("quantity").length !== 0) ? morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("quantity")[0].childNodes[0].nodeValue : 1;
			for (j = 0; j < quantity; j++) {
				morphChoices++;
				if (parseInt(morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue, 10) > 0) {
					output += "+";
				}
				output += "<font id=\"morphChoice" + morphChoices + "Amount\">" + morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("amount")[0].childNodes[0].nodeValue + "<\/font> to ";
				output += "<select id=\"morphChoice" + morphChoices + "\">";
				numChoices = morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("choice").length;
				for (k = 0; k < numChoices; k++) {
					aptName = morphData[num].getElementsByTagName("aptmod")[i].getElementsByTagName("choice")[k].childNodes[0].nodeValue;
					// Assemble list of all aptitudes?
					if (aptName === "Any") {
						output += "<option value=\"COG\">COG";
						output += "<option value=\"COO\">COO";
						output += "<option value=\"INT\">INT";
						output += "<option value=\"REF\">REF";
						output += "<option value=\"SAV\">SAV";
						output += "<option value=\"SOM\">SOM";
						output += "<option value=\"WIL\">WIL";
					} else { // Default, list a specific aptitude
						output += "<option value=\"" + aptName + "\">" + aptName;
					}
				}
				output += "<\/select><br />";
			}
		}
	}
	document.getElementById("morphOptions").innerHTML = output;
	removeTemplate("morph");
	// Refund and reenable all morph traits
	temp = document.getElementsByName("traitBox");
	for (i = 0; i < temp.length; i++) {
		if (temp[i].dataset.traitSource === "Morph"){
			if (temp[i].disabled) {
				temp[i].disabled = false;
			}
			if (temp[i].checked){
				temp[i].checked = false;
				removeTrait(temp[i].dataset.traitType, temp[i].dataset.traitName, temp[i].dataset.traitSource, 0, false);
			}
		}
	}
	myCharacter.morph.ID = myCharacter.morph.temp;
	applyTemplate("morph");
	// Disable invalid traits
	for (i = 0; i < temp.length; i++) {
		if ((temp[i].dataset.traitSource === "Morph") && (!temp[i].disabled)){
			if (!checkTraitReqs(temp[i].dataset.traitType, temp[i].dataset.traitName, temp[i].dataset.traitSource, true)) {
				temp[i].disabled = true;
			}
		}
	}
	updateCP();
}

function toggleSleight() {
	var type = this.dataset.sleightType;
	if (this.checked) {
		myCharacter.CP -= 5;
		myCharacter.ego.psiSleights["total" + type]++;
		myCharacter.ego.psiSleights[type][this.dataset.sleightId] = 1;
	} else {
		myCharacter.CP += 5;
		myCharacter.ego.psiSleights["total" + type]--;
		myCharacter.ego.psiSleights[type][this.dataset.sleightId] = 0;
	}
	updateCP();
}

function toggleSpec(skill, field) {
	if (document.getElementById("skill" + skill + "field" + field + "specbox").checked) {
		myCharacter.CP -= 5;
		document.getElementById("skill" + skill + "field" + field + "spectext").value = "";
		document.getElementById("skill" + skill + "field" + field + "spectext").disabled = false;
	} else {
		myCharacter.CP += 5;
		document.getElementById("skill" + skill + "field" + field + "spectext").value = "";
		document.getElementById("skill" + skill + "field" + field + "spectext").disabled = true;
	}
	updateCP();
}

function updateSkill(id, field, category) {
	var value, total, cost, change, i, k, l, tempData, flag;
	value = parseInt(document.getElementById("skill" + id + "field" + field + "purchased").value, 10);
	// Set value to 0 if value is invalid or the field entry exists and has been left blank.
	if ((value < 0) || (isNaN(value)) || ((document.getElementById("skill" + id + "field" + field + "input") !== null) && (document.getElementById("skill" + id + "field" + field + "input").value.replace(/^\s+|\s+$/g, '') === ""))) {
		value = 0;
	}
	value = Math.round(value);
	total = value + parseInt(document.getElementById("skill" + id + "field" + field + "base").innerHTML, 10);
	// Enable or disable specialization box?
	if (total >= 30) {
		document.getElementById("skill" + id + "field" + field + "specbox").disabled = false;
	} else {
		if (document.getElementById("skill" + id + "field" + field + "specbox").checked) {
			document.getElementById("skill" + id + "field" + field + "specbox").checked = false;
			toggleSpec(id, field);
		}
		document.getElementById("skill" + id + "field" + field + "specbox").disabled = true;
	}
	// Ranks that push the total over 60 cost double
	cost = (total < 60) ? value : value + (total - 60);
	// Check if faction or background provides a CP cost mod and adjust
	for (i = 0; i < 2; i++) {
		tempData = (i === 0) ? factionData[myCharacter.ego.faction].getElementsByTagName("skillmod") : backgroundData[myCharacter.ego.background].getElementsByTagName("skillmod");
		for (k = 0; k < tempData.length; k++) {
			if (tempData[k].getElementsByTagName("CPcost").length !== 0) {
				flag = 0;
				// Check if skill name matches skillmod name
				if (tempData[k].getElementsByTagName("name")[0].childNodes[0].nodeValue === skillData[id].getElementsByTagName("name")[0].childNodes[0].nodeValue) {
					flag = 1;
				}
				// Check if skill category matches skillmod name
				for (l = 0; l < skillData[id].getElementsByTagName("category").length; l++) {
					if (tempData[k].getElementsByTagName("name")[0].childNodes[0].nodeValue === skillData[id].getElementsByTagName("category")[l].childNodes[0].nodeValue) {
						flag = 1;
					}
				}
				if (flag) {
					cost = Math.ceil(cost * parseFloat(tempData[k].getElementsByTagName("CPcost")[0].childNodes[0].nodeValue));
				}
			}
		}
	}
	change = cost - parseInt(document.getElementById("skill" + id + "field" + field + "cost").innerHTML, 10);
	myCharacter.CP -= change;
	myCharacter["CPSpentOn" + category + "Skills"] += change;
	document.getElementById("skill" + id + "field" + field + "purchased").value = value;
	document.getElementById("skill" + id + "field" + field + "total").innerHTML = total;
	document.getElementById("skill" + id + "field" + field + "cost").innerHTML = cost;
	updateCP();
}

function incrementMiscCP() {
	var costPer = 1, maxCP = 999999, maxVal = 999999, multiplier = 1, oldCost, newCost, baseValue, oldValue, newValue, statName;
	if (this.dataset.type === "Stat") {
		switch (this.dataset.name) {
		case "Credit":
			multiplier = 1000;
			maxCP = 100;
			break;
		case "Moxie":
			costPer = 15;
			maxVal = 10;
			break;
		default:
		 alert("Unknown stat " + this.dataset.name + ".");
		}
	}
	if (this.dataset.type === "Apt") {
		costPer = 10;
		maxVal = 30;
		// Check exceptional aptitude trait
		if ((document.getElementById("traitExceptional AptitudeEgo").checked) && (document.getElementById("traitExceptional AptitudeEgoChoice").value === this.dataset.name)) {
			maxVal = 40;
		}
		// Check feeble trait
		if ((document.getElementById("traitFeebleEgo").checked) && (document.getElementById("traitFeebleEgoChoice").value === this.dataset.name)) {
			maxVal = 4;
		}
	}
	if (this.dataset.type === "Rep") {
		// Check blacklisted trait
		switch (this.dataset.name) {
			case "The @-list":
				statName = "ARep";
				break;
			case "CivicNet":
				statName = "CRep";
				break;
			case "EcoWave":
				statName = "ERep";
				break;
			case "Fame":
				statName = "FRep";
				break;
			case "Guanxi":
				statName = "GRep";
				break;
			case "The Eye":
				statName = "IRep";
				break;
			case "RNA":
				statName = "RRep";
				break;	
			default:
			alert("Unknown rep " + this.dataset.name + ".");
		}
		if ((document.getElementById("traitBlacklistedEgo").checked) && (document.getElementById("traitBlacklistedChoice").value === statName)) {
			return;
		}
		multiplier = 10;
		maxVal = 80;
		maxCP = 35;
	}
	baseValue = parseInt(document.getElementById("misc" + this.dataset.type + this.dataset.name + "Base").innerHTML, 10);
	oldValue = parseInt(document.getElementById("misc" + this.dataset.type + this.dataset.name + "Value").innerHTML, 10);
	oldCost = parseInt(document.getElementById("misc" + this.dataset.type + this.dataset.name + "Cost").innerHTML, 10);
	newValue = oldValue + multiplier * parseInt(this.dataset.direction, 10);
	newCost = oldCost + costPer * parseInt(this.dataset.direction, 10);
	if ((newValue < 0) || (newValue + baseValue > maxVal) || (newCost > maxCP)) {
		return;
	}
	myCharacter.CP -= newCost - oldCost;
	document.getElementById("misc" + this.dataset.type + this.dataset.name + "Value").innerHTML = newValue;
	document.getElementById("misc" + this.dataset.type + this.dataset.name + "Cost").innerHTML = newCost;
	document.getElementById("misc" + this.dataset.type + this.dataset.name + "TotalValue").innerHTML = newValue + baseValue;
	updateCP();
}

function updateStartApt() {
	var total = 105;
	total -= parseInt(document.getElementById("startCOG").value, 10);
	total -= parseInt(document.getElementById("startCOO").value, 10);
	total -= parseInt(document.getElementById("startINT").value, 10);
	total -= parseInt(document.getElementById("startREF").value, 10);
	total -= parseInt(document.getElementById("startSAV").value, 10);
	total -= parseInt(document.getElementById("startSOM").value, 10);
	total -= parseInt(document.getElementById("startWIL").value, 10);
	document.getElementById("remainingAptPts").innerHTML = total;
	document.getElementById("remainingAptPts").color = (total !== 0) ? "red" : "black";
}

function updateStartRep() {
	var total = myCharacter.ego.reputations.total;
	total -= parseInt(document.getElementById("startARep").value, 10);
	total -= parseInt(document.getElementById("startCRep").value, 10);
	total -= parseInt(document.getElementById("startERep").value, 10);
	total -= parseInt(document.getElementById("startFRep").value, 10);
	total -= parseInt(document.getElementById("startGRep").value, 10);
	total -= parseInt(document.getElementById("startIRep").value, 10);
	total -= parseInt(document.getElementById("startRRep").value, 10);
	document.getElementById("remainingRepPts").innerHTML = total;
	document.getElementById("remainingRepPts").color = (total !== 0) ? "red" : "black";
}

function updateFixedDiv() {
	var div = document.getElementById("fixeddiv");
	// Reset and hide all
	document.getElementById("positiveTraitsCPdiv").style.display = "none";
	document.getElementById("negativeTraitsCPdiv").style.display = "none";
	document.getElementById("negativeMorphTraitsCPdiv").style.display = "none";
	document.getElementById("activeSkillsCPdiv").style.display = "none";
	document.getElementById("knowledgeSkillsCPdiv").style.display = "none";
	document.getElementById("psiChiSleightsdiv").style.display = "none";
	document.getElementById("psiGammaSleightsdiv").style.display = "none";
	document.getElementById("startingRepdiv").style.display = "none";
	document.getElementById("startingAptdiv").style.display = "none";
	document.getElementById("totalCPdiv").style.display = "none";
	// Enable and resize
	switch (currentSection) {
	case "AptitudesFreePointsSection":
		document.getElementById("positiveTraitsCPdiv").style.display = "block";
		document.getElementById("negativeTraitsCPdiv").style.display = "block";
		document.getElementById("startingAptdiv").style.display = "block";
		document.getElementById("totalCPdiv").style.display = "block";
		break;
	case "EgoTraitsSection":
		document.getElementById("positiveTraitsCPdiv").style.display = "block";
		document.getElementById("negativeTraitsCPdiv").style.display = "block";
		document.getElementById("totalCPdiv").style.display = "block";
		break;
	case "MiscCPSection":
		document.getElementById("totalCPdiv").style.display = "block";
		break;
	case "MorphSection":
		document.getElementById("positiveTraitsCPdiv").style.display = "block";
		document.getElementById("negativeTraitsCPdiv").style.display = "block";
		document.getElementById("negativeMorphTraitsCPdiv").style.display = "block";
		document.getElementById("totalCPdiv").style.display = "block";
		break;
	case "PsiSleightsSection":
		document.getElementById("psiChiSleightsdiv").style.display = "block";
		document.getElementById("psiGammaSleightsdiv").style.display = "block";
		document.getElementById("totalCPdiv").style.display = "block";
		break;
	case "RepFreePointsSection":
		document.getElementById("positiveTraitsCPdiv").style.display = "block";
		document.getElementById("negativeTraitsCPdiv").style.display = "block";
		document.getElementById("totalCPdiv").style.display = "block";
		document.getElementById("startingRepdiv").style.display = "block";
		break;
	case "SkillsSection":
		document.getElementById("positiveTraitsCPdiv").style.display = "block";
		document.getElementById("negativeTraitsCPdiv").style.display = "block";
		document.getElementById("activeSkillsCPdiv").style.display = "block";
		document.getElementById("knowledgeSkillsCPdiv").style.display = "block";
		document.getElementById("totalCPdiv").style.display = "block";
		break;
	default:
	}
}

function loadNext() {
	var nextSection;
	if (!saveSection(currentSection)) {
		return;
	}
	switch (currentSection) {
	case "LoadingSection":
		nextSection = "ConceptSection";
		break;
	case "ConceptSection":
		nextSection = "BackgroundSection";
		break;
	case "BackgroundSection":
		nextSection = "FactionSection";
		break;
	case "FactionSection":
		nextSection = "AptitudesFreePointsSection";
		break;
	case "AptitudesFreePointsSection":
		nextSection = "EgoTraitsSection";
		break;
	case "EgoTraitsSection":
		if (myCharacter.ego.positiveTraits[lookupTraitID("positive","Psi (Level 1)","Ego")]) {
			nextSection = "PsiSleightsSection";
		} else {
			nextSection = "RepFreePointsSection";
		}
		break;
	case "PsiSleightsSection":
		nextSection = "RepFreePointsSection";
		break;
	case "RepFreePointsSection":
		nextSection = "MorphSection";
		break;
	case "MorphSection":
		nextSection = "SkillsSection";
		break;
	case "SkillsSection":
		nextSection = "MiscCPSection";
		break;
	default:
		alert("Unexpected section " + currentSection + ".");
		return;
	}
	if (!setupSection(nextSection)) {
		alert("Error loading section " + nextSection + ".");
		return;
	}
	document.getElementById(currentSection).style.display = "none";
	document.getElementById(nextSection).style.display = "block";
	currentSection = nextSection;
	updateCP();
	updateFixedDiv();
	// Button mods
	if (currentSection === "MiscCPSection") {
		this.disabled = true;
	}
	if (currentSection !== "ConceptSection") {
		document.getElementById("previousButton").disabled = false;
	}
}

function loadPrevious () {
	var previousSection;
	// Check CP
	if (myCharacter.CP < 0) {
		alert("You do not have enough CP.");
		return;
	}
	if (myCharacter.CPSpentOnPositiveTraits > 50) {
		alert("You may not spend more than 50 CP on positive traits.");
		return;
	}
	if (myCharacter.CPGainedFromNegativeTraits > 50) {
		alert("You may not purchase more than 50 CP worth of negative traits.");
		return;
	}
	switch (currentSection) {
	case "BackgroundSection":
		previousSection = "ConceptSection";
		break;
	case "FactionSection":
		previousSection = "BackgroundSection";
		break;
	case "AptitudesFreePointsSection":
		previousSection = "FactionSection";
		break;
	case "EgoTraitsSection":
		previousSection = "AptitudesFreePointsSection";
		break;
	case "PsiSleightsSection":
		previousSection = "EgoTraitsSection";
		break;
	case "RepFreePointsSection":
		if (myCharacter.ego.positiveTraits[lookupTraitID("positive","Psi (Level 1)","Ego")]) {
			previousSection = "PsiSleightsSection";
		} else {
			previousSection = "EgoTraitsSection";
		}
		break;
	case "MorphSection":
		previousSection = "RepFreePointsSection";
		break;
	case "SkillsSection":
		previousSection = "MorphSection";
		break;
	case "MiscCPSection":
		previousSection = "SkillsSection";
		break
	default:
		alert("Unexpected section " + currentSection + ".");
		return;
	}
	document.getElementById(currentSection).style.display = "none";
	document.getElementById(previousSection).style.display = "block";
	currentSection = previousSection;
	updateCP();
	updateFixedDiv();
	// Buttons mods
	if (currentSection === "ConceptSection") {
		this.disabled = true;
	}
	document.getElementById("nextButton").disabled = false;
}

function initialSetup() {
	var i, j, output, output2, temp, tempData, name, cost, description, source, type, xmlDoc, xmlhttp;
	currentSection = "LoadingSection";
	// Load data objects
	xmlhttp = new XMLHttpRequest();			
	xmlhttp.open("GET", "xml/CoreRules.xml", false);
	xmlhttp.send();
	xmlDoc = xmlhttp.responseXML;
	backgroundData = xmlDoc.getElementsByTagName("backgrounds")[0].getElementsByTagName("background");
	factionData = xmlDoc.getElementsByTagName("factions")[0].getElementsByTagName("faction");
	morphData = xmlDoc.getElementsByTagName("morphs")[0].getElementsByTagName("morph");
	skillData = xmlDoc.getElementsByTagName("skills")[0].getElementsByTagName("skill");
	positiveTraitData = xmlDoc.getElementsByTagName("positiveTraits")[0].getElementsByTagName("trait");
	negativeTraitData = xmlDoc.getElementsByTagName("negativeTraits")[0].getElementsByTagName("trait");
	psiData = xmlDoc.getElementsByTagName("psisleights");
	myCharacter = new Character();
	// Traits
	for (i = 0; i < 2; i++) {
		type = (i === 0) ? "positive" : "negative";
		tempData = (i === 0) ? positiveTraitData : negativeTraitData;
		output = "<table><tr><td><b><\/b><\/td><td><b>Cost<\/b><\/td><td><b>Name<\/b><\/td><td><b>Source<\/b><\/td><td><b>Description<\/b><\/td><\/tr>"; // Ego
		output2 = "<table><tr><td><b><\/b><\/td><td><b>Cost<\/b><\/td><td><b>Name<\/b><\/td><td><b>Source<\/b><\/td><td><b>Description<\/b><\/td><\/tr>"; // Morph
		for (j = 0; j < tempData.length; j++) {
			myCharacter.ego[type + "Traits"][j] = 0;
			myCharacter.morph[type + "Traits"][j] = 0;
			name = tempData[j].getElementsByTagName("name")[0].childNodes[0].nodeValue;
			cost = parseInt(tempData[j].getElementsByTagName("CP")[0].childNodes[0].nodeValue, 10);
			description = tempData[j].getElementsByTagName("description")[0].childNodes[0].nodeValue;
			source = tempData[j].getElementsByTagName("source")[0].childNodes[0].nodeValue;
			// Skip the traits that appear elsewhere
			if ((name !== "Exceptional Aptitude") && (name !== "Second Skin") && (name !== "Expert") && (name !== "Incompetent") && (name !== "Feeble") && (name !== "Blacklisted")) {
				temp = "<tr>";
				temp += "<td><input type=\"checkbox\" name=\"traitBox\" id=\"trait" + name + source + "\" data-trait-name=\"" + name + "\" data-trait-type=\"" + type + "\" data-trait-source=\"" + source + "\" "; // Check box
				// No traits are purchased by default, so any requirements will not have been met
				if (tempData[j].getElementsByTagName("requires").length !== 0) { 
					temp += "disabled=\"true\" ";
				}
				temp +="/><\/td>"; // Check box
				temp += "<td>" + cost + "<\/td>"; // Cost
				temp += "<td><b>" + name + "<\/b><\/td>"; // Name
				temp += "<td>" + source + "<\/td>"; // Source
				temp += "<td>" + description + "<\/td>"; // Description
				temp += "<\/tr>";
				if (source === "Ego") {
					output += temp;
				} else {
					output2 += temp;
				}
			}
		}
		output += "<\/table>";
		output2 += "<\/table>";
		document.getElementById(type + "EgoTraits").innerHTML = output;
		document.getElementById(type + "MorphTraits").innerHTML = output2;
	}
	temp = document.getElementsByName("traitBox");
	for (i = 0; i < temp.length; i++) {
		temp[i].onchange = toggleTrait;
	}
	// psiSleights
	for (i = 0; i < 2; i++) {
		type = (i === 0) ? "Chi" : "Gamma";
		myCharacter.ego.psiSleights
		tempData = psiData[0].getElementsByTagName(type)[0].getElementsByTagName("sleight");
		// name,description,enables?,requires?,type?,action?,range?,duration?,strainmod?,skill?,skillmod*,othermod*
		output = "<table><tr><td><\/td><td><b>Name<\/b><\/td><td><b>Type<\/b><\/td><td><b>Action<\/b><\/td><td><b>Range<\/b><\/td><td><b>Duration<\/b><\/td><td><b>Strainmod<\/b><\/td><td><b>Skill<\/b><\/td><\/tr><tr><td><\/td><td><b>Description<\/b><\/td><td><\/td><td><\/td><td><\/td><td><\/td><td><\/td><td><\/td><\/tr>";
		for (j = 0; j < tempData.length; j++) {
			name = tempData[j].getElementsByTagName("name")[0].childNodes[0].nodeValue;
			output += "<tr>";
			output += "<td><input type=\"checkbox\" name=\"sleightBox\" id=\"sleight" + name + type + "\" data-sleight-Type=\"" +  type + "\" data-sleight-id=\"" + j + "\" "; // Check Box
			if (type === "Gamma") {
				output += "disabled = \"true\" ";
			}
			output += "/><\/td>";
			output += "<td><b>" + name + "<\/b><\/td>"; // Name
			output += "<td><b>" + tempData[j].getElementsByTagName("type")[0].childNodes[0].nodeValue + "<\/b><\/td>"; // Type
			output += "<td><b>" + tempData[j].getElementsByTagName("action")[0].childNodes[0].nodeValue + "<\/b><\/td>"; // Action
			output += "<td><b>" + tempData[j].getElementsByTagName("range")[0].childNodes[0].nodeValue + "<\/b><\/td>"; // Range
			output += "<td><b>" + tempData[j].getElementsByTagName("duration")[0].childNodes[0].nodeValue + "<\/b><\/td>"; // Duration
			output += "<td><b>";
			if (tempData[j].getElementsByTagName("strainmod").length !== 0) {
				output += tempData[j].getElementsByTagName("strainmod")[0].childNodes[0].nodeValue;
			}
			output +="<\/b><\/td>"; // Strainmod
			output += "<td><b>";
			if (tempData[j].getElementsByTagName("skill").length !== 0) {
				output += tempData[j].getElementsByTagName("skill")[0].childNodes[0].nodeValue;
			}
			output += "<\/b><\/td>"; // Skill
			output += "<\/tr>";
			output += "<tr><td><\/td><td>" + tempData[j].getElementsByTagName("description")[0].childNodes[0].nodeValue + "<\/td><td><\/td><td><\/td><td><\/td><td><\/td><td><\/td><td><\/td>"; // Description
			output += "<\/tr>";
		}
		output += "<\/table>";
		document.getElementById("psi-" + type).innerHTML = output;
	}
	temp = document.getElementsByName("sleightBox");
	for (i = 0; i < temp.length; i++) {
		temp[i].onchange = toggleSleight;
	}
	// Backgrounds
	output = "";
	for (i = 0; i < backgroundData.length; i++) {
		output += "<option value='" + i + "'>";
		output += backgroundData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		output += "<\/option>";
	}
	document.getElementById("bg").innerHTML = output;
	document.getElementById("bg").value = 0;
	selectBG();
	document.getElementById("bg").onchange = selectBG;
	applyTemplate("background");
	// Factions
	output = "";
	for (i = 0; i < factionData.length; i++) {
		output += "<option value='" + i + "'>";
		output += factionData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		output += "<\/option>";
	}
	document.getElementById("fac").innerHTML = output;
	document.getElementById("fac").value = 0;
	selectFac(0);
	document.getElementById("fac").onchange = selectFac;
	applyTemplate("faction");
	// Aptitudes
	for (i = 1; i <= 7; i++) {
		temp = "";
		switch (i) {
		case 1:
			temp = "COG";
			break;
		case 2:
			temp = "COO";
			break;
		case 3:
			temp = "INT";
			break;
		case 4:
			temp = "REF";
			break;
		case 5:
			temp = "SAV";
			break;
		case 6:
			temp = "SOM";
			break;
		case 7:
			temp = "WIL";
			break;
		default:
		}
		output = "";
		for (j = 0; j <= 40; j++) {
			output += "<option value='" + j + "'>" + j + "<\/option>";
		}
		document.getElementById("start" + temp).innerHTML = output;
		document.getElementById("start" + temp).value = 15;
		document.getElementById("start" + temp).onchange = updateStartApt;
	}
	document.getElementById("remainingAptPts").innerHTML = 0;
	// Rep
	for (i = 1; i <= 7; i++) {
		temp = "";
		switch (i) {
		case 1:
			temp = "A";
			break;
		case 2:
			temp = "C";
			break;
		case 3:
			temp = "E";
			break;
		case 4:
			temp = "F";
			break;
		case 5:
			temp = "G";
			break;
		case 6:
			temp = "I";
			break;
		case 7:
			temp = "R";
			break;
		default:
			alert("Error in Rep setup.");
		}
		output = "";
		for (j = 0; j <= 50; j++) {
			output += "<option value='" + j + "'>" + j + "<\/option>";
		}
		document.getElementById("start" + temp + "Rep").innerHTML = output;
		document.getElementById("start" + temp + "Rep").value = 0;
		document.getElementById("start" + temp + "Rep").onchange = updateStartRep;
	}
	// Morphs
	output = "";
	for (i = 0; i < morphData.length; i++) {
		output += "<option value='" + i + "'>";
		output += morphData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		output += "<\/option>";
	}
	document.getElementById("morph").innerHTML = output;
	document.getElementById("morph").value = 0;
	document.getElementById("morph").onchange = selectMorph;
	//selectMorph();
	applyTemplate("morph");
	// Learned Skills
	output = "";
	for (i = 0; i < skillData.length; i++) {
		output += "<option value='" + i + "'>";
		output += skillData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		output += "<\/option>";
	}
	document.getElementById("traitExpertChoice").innerHTML = output;
	output = "";
	for (i = 0; i < skillData.length; i++) {
		name = skillData[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		temp = 0;
		for (j = 0; j < skillData[i].getElementsByTagName("category").length; j++) {
			if ((skillData[i].getElementsByTagName("category")[j].childNodes[0].nodeValue === "Active") && (name !== "Exotic Melee Weapon") && (name !== "Exotic Range Weapon")) {
				temp = 1;
			}
		}
		// Only active skills, excluding Exotic Weapon
		if (temp) {
			output += "<option value='" + i + "'>";
			output += name;
			output += "<\/option>";
		}
	}
	document.getElementById("traitIncompetentChoice").innerHTML = output;
	// Misc CP setup
	output = "<table><tr><td><b>Type<\/b><\/td><td><b>Name<\/b><\/td><td><b>Cost to Raise<\/b><\/td><td><b>Base Value<\/b><\/td><td><\/td><td><b>Purchased<\/b><\/td><td><\/td><td><b>Total Value<\/b><\/td><td><b>Total Cost<\/b><\/td><\/tr>";
	for (i = 1; i <= 16; i++) {
		switch (i) {
		case 1:
			type = "Stat";
			name = "Moxie";
			cost = "15";
			break;
		case 2:
			type = "Stat";
			name = "Credit";
			cost = "1 per 1000";
			break;
		case 3:
			type = "Apt";
			name = "COG";
			cost = "10";
			break;
		case 4:
			type = "Apt";
			name = "COO";
			cost = "10";
			break;
		case 5:
			type = "Apt";
			name = "INT";
			cost = "10";
			break;
		case 6:
			type = "Apt";
			name = "REF";
			cost = "10";
			break;
		case 7:
			type = "Apt";
			name = "SAV";
			cost = "10";
			break;
		case 8:
			type = "Apt";
			name = "SOM";
			cost = "10";
			break;
		case 9:
			type = "Apt";
			name = "WIL";
			cost = "10";
			break;
		case 10:
			type = "Rep";
			name = "The @-list";
			cost = "1 per 10";
			break;
		case 11:
			type = "Rep";
			name = "CivicNet";
			cost = "1 per 10";
			break;
		case 12:
			type = "Rep";
			name = "EcoWave";
			cost = "1 per 10";
			break;
		case 13:
			type = "Rep";
			name = "Fame";
			cost = "1 per 10";
			break;
		case 14:
			type = "Rep";
			name = "Guanxi";
			cost = "1 per 10";
			break;
		case 15:
			type = "Rep";
			name = "The Eye";
			cost = "1 per 10";
			break;
		case 16:
			type = "Rep";
			name = "RNA";
			cost = "1 per 10";
			break;
		default:
			type = "";
			name = "";
			cost = "";
		}
		output += "<tr>";
		output += "<td>" + type + "<\/td>";
		output += "<td>" + name + "<\/td>";
		output += "<td>" + cost + "<\/td>";
		output += "<td><div id=\"misc" + type + name + "Base\"><\/div><\/td>";
		output += "<td><input name=\"miscCPButton\" type=\"button\" value=\"-\" data-type=\"" + type +"\" data-name=\"" + name + "\" data-direction=\"-1\" /><\/td>";
		output += "<td><div id=\"misc" + type + name + "Value\">0<\/div><\/td>";
		output += "<td><input name=\"miscCPButton\" type=\"button\" value=\"+\" data-type=\"" + type +"\" data-name=\"" + name + "\" data-direction=\"1\" /><\/td>";
		output += "<td><div id=\"misc" + type + name + "TotalValue\"><\/div><\/td>";
		output += "<td><div id=\"misc" + type + name + "Cost\">0<\/div><\/td>";
		output += "<\/tr>";
	}
	output+= "<\/table>";
	document.getElementById("miscCPTable").innerHTML = output;
	temp = document.getElementsByName("miscCPButton");
	for (i = 0; i < temp.length; i++) {
		temp[i].onclick = incrementMiscCP;
	}
	// Document Ready
	document.getElementById("previousButton").onclick = loadPrevious;
	document.getElementById("nextButton").onclick = loadNext;
	document.getElementById("fixeddiv").style.display = "block";
	document.onkeypress = keypress;
	loadNext();
}

//window.onload = initialSetup;
