export default function getDefaultXml(id,name) {
  const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
	    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
	    xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
	    xmlns:activiti="http://activiti.org/bpmn" 
	    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
	    xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" 
	    xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" 
	    typeLanguage="http://www.w3.org/2001/XMLSchema" 
	    expressionLanguage="http://www.w3.org/1999/XPath" 
	    targetNamespace="http://www.activiti.org/test">
      <process id="${id}" name="${name}" isExecutable="true">
      </process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1" >
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </definitions>`;

  return diagramXML;
}
