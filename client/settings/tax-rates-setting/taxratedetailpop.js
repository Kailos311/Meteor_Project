import {
    TaxRateService
} from "../settings-service";
import {
    ReactiveVar
} from 'meteor/reactive-var';
import {
    SideBarService
} from '../../js/sidebar-service';
import '../../lib/global/indexdbstorage.js';

import { Template } from 'meteor/templating';
import './taxratedetailpop.html';

Template.taxdetailpop.onCreated(function () {

});

Template.taxdetailpop.onRendered(function () {

});

Template.taxdetailpop.events({
    
});

Template.taxdetailpop.helpers({

});

Template.registerHelper('equals', function (a, b) {
    return a === b;
});
