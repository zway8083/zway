LOG='[MAIN]>'

UPDATE_FOLDER_PATH="$HOME"'/update'

echo "$LOG" Moving to "$UPDATE_FOLDER_PATH"
mkdir -p -- "$UPDATE_FOLDER_PATH" &>/dev/null && cd "$UPDATE_FOLDER_PATH"
git status &>/dev/null
if [ "$?" -ne 0 ]; then
    echo "$LOG" "Cloning repository"
    git clone https://github.com/zway8083/update.git .
else
    git fetch origin
    CHANGE=$(git log HEAD..origin/master --oneline | wc -l)
    if [ "$CHANGE" -gt 0 ]; then
        echo "$LOG" "Repository: pulling new files"
        git pull origin master
    fi
    echo "$LOG" "Repository: no changes"
fi

echo "$LOG" Executing the updater
./updater.sh
