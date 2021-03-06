let marked = require('marked')
let ipc = require('electron').ipcRenderer
let moment = require('moment')
let path  = require('path')
let fs = require('fs')
let parseJSON = require('json-parse-async')
let randomstring = require('randomstring')
let storage = require('electron-json-storage')
    
$(document).ready(() => {
    
    storage.has('notae', (err, haskey) => {
        if (err) throw err
        if (!haskey) {
            storage.set('notae', { "notae": [] }, err => {
                if (err) throw err
            })
        }
        
        let sidelist = document.getElementById('sidelist')
        sidelist.innerHTML = ""
        let button = document.getElementById('addnota')
        let deleter = document.getElementById('deletenota')
        let titleInput = document.getElementById('title')
        
        
        //I'll use this to store the note so that I can pass in the functions
        let currentNota = null
        
        let notae = {}
        
        titleInput.addEventListener('keydown', (e) => {
            if (e.keyCode == 13) {
                console.log("Key code 13")
                name(currentNota.id, titleInput.value)
            }
        })
        
        
        
        storage.get('notae', (err, data) => {
            if (err) throw err
            
                notae = data
                if (notae.notae.length > 0) {
                    currentNota = notae.notae[0]
                    open(currentNota.id) 
                    loadSidebar(notae, 0)
                    if (currentNota.name != '') titleInput.value = currentNota.name
                    
                }
                
                
                
        
        })
        
        
        button.addEventListener('click', () => {
            let obj = {
                name: '',
                date: moment().format("MMM Do YYYY"),
                file: randomstring.generate() + '.md',
                id: notae.notae.length
            }
            
            fs.writeFile(path.join('~','notae', obj.file), "# This is an empty file", 'utf-8', err => {
                if (err) throw err
            })
            
            notae.notae.unshift(obj)
            currentNota = notae.notae[0]
            writeMetadata()
        })
        
        deleter.addEventListener('click', () => {
            //first delete real file
            fs.unlink(path.join('~', 'notae', currentNota.file), (err) => {
                if (err) throw err
            })
            //then delete metadata
            notae.notae.splice(currentNota.id, 1)
            if (notae.notae.length > 0) {
                currentNota = notae.notae[currentNota.id - 1]
            
                //change ids
                
                for (var i = notae.notae.length; i > currentNota.id; i--) {
                    notae.notae[i].id -= 1
                }
                currentNota.id -= 1
            } else {
                currentNota = null
            }
            
            
            writeMetadata()
        })
        
        ipc.on('save', () => {
            //save
            console.log($('#input').val())
            fs.writeFile(path.join('~', 'notae', currentNota.file), $('#input').val(), 'utf-8', (err) => {
                if (err) throw err
            })
            //show save banner
        })
        
        
        
        function loadSidebar(notae, id) {
            $('#sidelist').empty()
            for (var i = 0; i < notae.notae.length; i++) {
                var string = ''
                if (notae.notae.length > 0) {
                    
                    let name = notae.notae[i].name
                    console.log(name)
                    let date = notae.notae[i].date
                    console.log(date)
                    
                    if (i == id) {
                        string = '<li class="sideitem active"> <h6 class="titletext"><strong>' + name.substring(0, 10) + '</strong></h6> <p class="datetext">' + date + '</p> </li>\n'
                    } else {
                        string = '<li class="sideitem"> <h6 class="titletext"><strong>' + name.substring(0, 10) + '</strong></h6> <p class="datetext">' + date + '</p> </li>\n'
                    }
                }
                console.log(string)
                $('#sidelist').append(string)
            }
            
            $('.sideitem').click(function(){
                var index = $(this).index()
                console.log(index)
                currentNota = notae.notae[index]
                console.log('current ',currentNota.id)
                open(currentNota.id)
                $('.sideitem').removeClass('active')
                $(this).addClass('active')
                
                
            })
        }
        
        function open(nota) {
            fs.readFile(path.join(__dirname, 'notae', notae.notae[nota].file), 'utf-8', (err, data) => {
                if (err) throw err
                var input = $('#input')
                input.val(data)
                var preview = marked(input.val())
                $('#preview').empty()
                $('#preview').append(preview)
            })
        }
        
        
        function writeMetadata() {
            console.log("Writing metadata")
            
            storage.set('notae', JSON.stringify(notae, 4), err => {
                if (err) throw err
            })
            
            if (currentNota != null) {
                loadSidebar(notae, currentNota.id)
            } else {
                loadSidebar(notae)
            }
            
        }
        
        function name(nota, newVal) {
            console.log("Renaming")
            notae.notae[nota].name = newVal
            renameFile(nota)
            writeMetadata()
        }
        
        function renameFile(nota) {
            let newName = notae.notae[nota].name.split(' ').join('-')
            /*fs.rename(`./notae/${notae.notae[nota].file}.md`, `./notae/${newName}.md`, err => {
                if (err) throw err
                notae.notae[nota].file = newName
                writeMetadata()
            })*/
        }
    })
    
    
})
