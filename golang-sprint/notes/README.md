# Notes tool

### What the Tool Does
The notes tool is a command-line application desingend to help users manage short single-line notes efficiently. It
allows users to create collections of notes, view existing ones. The tool aims to streamline note-taking and organization tasks for users, offering a simple and intuitive interface. 

### Usage of the Tool
To use the Notes Tool, users need to provide one argument, which is the name of the collection they want to manage. For example:

$ ./notestool coding_ideas
this command creates or manages a collection named "coding_ideas".

After providing the collection name, users are presented with a menu where they can choose from various operations:

1. Display notes from the collection.
2. Add a new note to the collection.
3. Remove an existing note from the collection.
4. Exit the program.

Users can navigate through the menu, perform their desired operations, and manage their notes effectively.

Here is example how you choose operation. If you want to choose add new note
```
Enter your choice: 2
Enter your note: Remember to breathe in the belly
```

Now if you want to see your note you just added

```
Enter your choice: 1

Notes:
001 - Remember to breathe in the belly
```

### Data Storage
For each collection, a separate database is created. The database is a plain text file with the same as the collection, where notes are stored in sperate rows. If the collection doesn't exist, it is created, and if it does, it is loaded- This ensures that notes persist between tool runs, allowing users to access their notes seamlessly.

---