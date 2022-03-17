
const vscode = require('vscode');

const fse = require('fs-extra');
const path = require('path');

function create() {

  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return; // No open text editor
  }

  let selection = editor.selection;

  //Get 

  let text = editor.document.getText(selection);

  if (!selection) return vscode.window.showErrorMessage("No text Selected");

  let folderPath = path.dirname(vscode.workspace.workspaceFolders[0].uri.path + "/" + vscode.workspace.workspaceFolders[0].name); // get the open folder path

  console.log("Path " + path.dirname(vscode.window.activeTextEditor.document.fileName))

  //Check if folder is in workspace
  if (folderPath == ".") return vscode.window.showErrorMessage("Your file must be in a workspace + " + folderPath);


  // Prompt for new component Name
  let options = {
    prompt: "Component Name: ",
    placeHolder: "MyComponent"
  }

  vscode.window.showInputBox(options).then(value => {
    if (!value) return vscode.window.showErrorMessage("No component name, Please try again");

    let component_name, component_path;

    //get path and component name
    if (value.includes("/")) {
      let n = value.lastIndexOf('/');
      component_name = value.substring(n + 1);
      component_path = value.substring(0, value.lastIndexOf('/'));
    } else {
      component_name = value;
    }

    //convert string to pascal case
    let output = component_name.replace(/(\w+)(?:\s+|$)/g, function (_, word) {
      return word.charAt(0).toUpperCase() + word.substr(1);
    });

    let start_pos = editor.selection.start
    //Replace selection with new component name
    editor.edit(builder => {

      builder.replace(selection, "")
      builder.insert(start_pos, `<${output}/>`)
    }).then(
      function () {
        let firstLine = editor.document.lineAt(0);
        let lastLine = editor.document.lineAt(editor.document.lineCount - 1);
        let textRange = new vscode.Range(0,
          firstLine.range.start.character,
          editor.document.lineCount - 1,
          lastLine.range.end.character);

        //Add imports by appending to script tag if exixts or prepending it to the file if it doesnt
        let all_text = editor.document.getText(textRange);
        let new_text;
        //IF COMPONENT HAS PATH

        if (component_path) {
          //Check if current svelte file has script tag
          if (all_text.includes("<script>")) {
            new_text = all_text.replace("<script>",
              `<script>
	import ${output} from "$lib/${component_path}/${output}.svelte"`)
          }
        } else {
          //NO COMPONENT PATH
          if (all_text.includes("<script>")) {
            new_text = all_text.replace("<script>",
              `<script>
	import ${output} from "$lib/${output}.svelte"`)
          } else {
            new_text =
              `<script>
	import ${output} from "./${output}.svelte"
</script>`+ all_text;
          }


        }


        editor.edit(builder => builder.replace(textRange, new_text))


      }
    )




    //Save new component with commented out script and style tags
    let filepath;
    if (!component_path) {
      filepath = path.join(folderPath + "/src/lib/", `${output}.svelte`);
    } else {
      filepath = path.join(folderPath + "/src/lib/", component_path, `${output}.svelte`);

    }






    fse.outputFile(filepath, text, err => {
      if (err) {
        return vscode.window.showErrorMessage(
          "Couldn't create component"
        );
      } else {
        console.log('The file was saved!');
        vscode.window.showInformationMessage("Component Extracted")

        //Open new component
        //let openPath = vscode.Uri.parse(filepath);
        vscode.workspace.openTextDocument(filepath).then(doc => {
          vscode.window.showTextDocument(doc);

        });
      }
    })






  });

};



module.exports = {
  create,
}