
# Contest Tracker

A responsive React web application that aggregates coding contests from multiple platforms including CodeForces, CodeChef, and LeetCode. It displays upcoming and past contests in a clean interface with features like bookmarking, status badges, and theme toggling.

## Features

- **Aggregated Contests:**  
  - Fetches contests from CodeForces (via its API) and CodeChef/LeetCode (via clist.by API).
- **Responsive Design:**  
  - Upcoming contests are shown in a horizontally scrollable section .
  - Past contests are displayed in a vertically scrollable grid.
- **Contest Details:**  
  - Each contest card displays the contest name, start time , duration, and a status badge .
  - Platform logos for CodeForces, CodeChef, and LeetCode are displayed on each card.
- **Bookmarking:**  
  - Mark contests as favorites using a star button that remains on each card.
- **Theme Toggle:**  
  - Toggle between light mode  and dark mode .
## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/karansingh21202/contest-tracker.git
   cd contest-tracker
   ```

2. **Install Dependencies:**

   Make sure you have [Node.js](https://nodejs.org/) installed, then run:

   ```bash
   npm install
   ```

   or, if you prefer Yarn:

   ```bash
   yarn install
   ```

## Configuration

This project fetches contest data from the following sources:

- **CodeForces API:**  
  No configuration needed.

- **clist.by API:**  
  The project uses clist.by to fetch CodeChef and LeetCode contest data. Configure your credentials by creating a `.env` file in the root directory (or update the constants in your code) with your API username and key.

  **Example `.env` file:**

  ```env
  
  your_api_key
  ```

  Then, update the axios requests in your code to use `process.env.REACT_APP_CLIST_USERNAME` and `process.env.REACT_APP_CLIST_API_KEY`.

## Running the Application

To start the development server, run:

```bash
npm run dev
```

or

```bash
yarn dev
```

Open your browser and navigate to the URL provided in your terminal 

## Building for Production

To build the application for production, run:

```bash
npm run build
```

or

```bash
yarn build
```



## Project Structure

- **src/App.jsx:**  
  Main React component that fetches contest data, implements filtering, bookmarking, and theme toggling.
- **src/index.css:**  
  Contains Tailwind CSS imports and global styles (scrollbar hiding is included here or via inline styles).
- Other standard React project files.


## Customization

- **Styling:**  
  Modify Tailwind classes in the React components to adjust card sizes, colors, and layouts.
- **API Parameters:**  
  Adjust the time windows for upcoming/past contests in the axios request parameters if needed.

![Screenshot (69)](https://github.com/user-attachments/assets/b997d31f-7894-4ab2-ad15-46bd00f337b4)

![Screenshot (70)](https://github.com/user-attachments/assets/cc801d7b-0954-4d0e-8388-9fd98e109a3f)
![Screenshot (71)](https://github.com/user-attachments/assets/4d885bc4-2c11-4130-b727-f0f9c7773dc8)

![Screenshot (72)](https://github.com/user-attachments/assets/f4f503d2-9c16-4974-b7b7-ca23928e6352)
![Screenshot (73)](https://github.com/user-attachments/assets/df9d3b36-b8f6-4cce-bfd6-ede2d08cad44)
![Screenshot (74)](https://github.com/user-attachments/assets/2f860505-ebfb-4005-a2d1-fe20e82b9709)
![Screenshot (75)](https://github.com/user-attachments/assets/6786127a-96ad-4202-a19a-6af1a55891cc)

![Screenshot (76)](https://github.com/user-attachments/assets/0af280f0-e6fd-4cf9-bf97-5e57de12ee0f)

