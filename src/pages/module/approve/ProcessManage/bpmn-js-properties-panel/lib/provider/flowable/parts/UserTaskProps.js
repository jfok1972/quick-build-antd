'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
  entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var syncRequest = require('../../../../../../../../../utils/request').syncRequest;
var API_HEAD = require('../../../../../../../../../utils/request').API_HEAD;
var users = [];
var groups = [];

function getUsers() {
  if (users.length === 0) {
    var usersResult = syncRequest(API_HEAD + "/platform/dataobject/fetchcombodata.do", {
      params: {
        moduleName: 'FUser'
      }
    });
    users.push({ name: '', value: '' });
    usersResult.forEach(function (rec) {
      users.push({
        name: rec.text,
        value: rec.value
      })
    })
  }
  return users;
}
function getGroups() {
  if (groups.length === 0) {
    var usersResult = syncRequest(API_HEAD +"/platform/dataobject/fetchcombodata.do", {
      params: {
        moduleName: 'FRole'
      }
    });
    groups.push({ name: '', value: '' });
    usersResult.forEach(function (rec) {
      groups.push({
        name: rec.text,
        value: rec.value
      })
    })
  }
  return groups;
}

module.exports = function (group, element, translate) {
  if (is(element, 'activiti:Assignable')) {

    // Assignee
    group.entries.push(entryFactory.selectBox({
      id: 'activiti:assignee',
      label: translate('Assignee'),
      // emptyParameter: true,
      selectOptions: getUsers(),
      modelProperty: 'activiti:assignee'
    }));

    // Candidate Users
    group.entries.push(entryFactory.textField({
      id: 'activiti:candidateUsers',
      label: translate('Candidate Users'),
      modelProperty: 'activiti:candidateUsers'
    }));

    // Candidate Groups
    group.entries.push(entryFactory.selectBox({
      id: 'activiti:candidateGroups',
      label: translate('Candidate Groups'),
      selectOptions: getGroups(),
      modelProperty: 'activiti:candidateGroups'
    }));

    // Due Date
    group.entries.push(entryFactory.textField({
      id: 'dueDate',
      description: translate('The due date as an EL expression (e.g. ${someDate} or an ISO date (e.g. 2015-06-26T09:54:00)'),
      label: translate('Due Date'),
      modelProperty: 'dueDate'
    }));

    // FollowUp Date
    group.entries.push(entryFactory.textField({
      id: 'followUpDate',
      description: translate('The follow up date as an EL expression (e.g. ${someDate} or an ' +
        'ISO date (e.g. 2015-06-26T09:54:00)'),
      label: translate('Follow Up Date'),
      modelProperty: 'followUpDate'
    }));

    // priority
    group.entries.push(entryFactory.textField({
      id: 'priority',
      label: translate('Priority'),
      modelProperty: 'priority'
    }));
  }
};
