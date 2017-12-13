import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import immstruct from 'immstruct';
import Immutable from 'immutable';

document.addEventListener("DOMContentLoaded", (event) => {
  ReactDOM.render(
    <App />,
    document.getElementById('app')
  );
});

class App extends Component {
  constructor(props) {
    super(props);
    this.structure = immstruct('survey-data', { surveys: [] });
    this.structure.on('swap', (newStructure, oldStructure, keyPath) => {
      this.setState({ appData: this.structure.cursor() });
    });
    this.state = {
      appData: this.structure.cursor(),
      newSurveyName: '',
    };
  }

  componentWillUnmount() {
    this.structure.st.removeAllListeners();
    immstruct.remove('survey-data');
  }

  updateNewSurveyName(e) {
    this.setState({newSurveyName: e.target.value});
  }

  createSurvey(e) {
    e.preventDefault();
    const name = this.state.newSurveyName;
    if (name) {
      this.state.appData.cursor('surveys').update((surveys) => {
        return surveys.push(Immutable.fromJS({ name: name, questions: [] }));
      });
      this.setState({newSurveyName: ''});
    }
  }

  removeSurvey(idx) {
    this.state.appData.cursor('surveys').delete(idx);
  }

  render() {
    const { appData } = this.state;
    return (
      <div>
        <h1>Survey Builder</h1>
        <div className='pure-g'>
          <div className='pure-u-1-2'>
            <form className='pure-form' onSubmit={this.createSurvey.bind(this)}>
              <p>
                <button
                  type='button'
                  className='pure-button'
                  placeholder='survey name'
                  onClick={this.createSurvey.bind(this)}
                >
                  <i className='fa fa-plus-circle'></i> Create Survey
                </button>
                {' '}
                <input
                  type='text'
                  value={this.state.newSurveyName}
                  onChange={this.updateNewSurveyName.bind(this)}
                />
              </p>
            </form>

            {appData.cursor('surveys').toArray().map((_, i)=>{
              return <Survey
                key={i}
                removeSurvey={this.removeSurvey.bind(this, i)}
                survey={appData.cursor(['surveys', i])}
              />;
            })}
          </div>
          <div className='pure-u-1-2'>
            <RawData data={appData.toJS()} />
          </div>
        </div>
      </div>
    );
  }
}

const RawData = (props) => {
  return (
    <pre>{JSON.stringify(props.data, undefined, '  ')}</pre>
  );
};

RawData.propTypes = {
  data: PropTypes.object.isRequired,
};

class Survey extends Component {
  constructor(props) {
    super(props);
    this.state = { newQuestion: '' };
  }

  shouldComponentUpdate(nextProps, nextState){
    return nextProps.survey.deref() !== this.props.survey.deref() ||
      nextState.newQuestion !== this.state.newQuestion;
  }

  createQuestion(e) {
    e.preventDefault();
    const name = this.state.newQuestion.trim();
    if (name) {
      this.props.survey.cursor('questions').update((questions)=>{
        const question = Immutable.fromJS({name: name, answers: [] });
        return questions.push(question);
      });
      this.setState({newQuestion: ''});
    }
  }

  removeQuestion(idx) {
    this.props.survey.cursor('questions').delete(idx);
  }

  updateNewQuestion(e) {
    this.setState({newQuestion: e.target.value});
  }

  render() {
    const {
      survey,
      removeSurvey,
    } = this.props;

    return (
      <div className='survey'>
        <h3>
          Survey: {survey.cursor('name').deref()}
        </h3>
        <p>
          <button
            type='button'
            className='pure-button button-error button-xsmall'
            onClick={removeSurvey.bind(this)}
          >
            <i className='fa fa-minus-circle'></i> Remove Survey
          </button>
        </p>
        <form className='pure-form' onSubmit={this.createQuestion.bind(this)}>
          <button className='pure-button' type='button' onClick={this.createQuestion.bind(this)}>
            <i className='fa fa-plus-circle'></i> Create Question
          </button>
          {' '}
          <input
            type='text'
            value={this.state.newQuestion}
            onChange={this.updateNewQuestion.bind(this)}
            placeholder='question'
          />
        </form>
        {survey.cursor('questions').toArray().map((_, idx)=>{
          return <Question key={idx}
            question={survey.cursor(['questions', idx])}
            removeQuestion={this.removeQuestion.bind(this, idx)}
          />;
        })}
      </div>
    );
  }
}

Survey.propTypes = {
  survey: PropTypes.shape({
    cursor: PropTypes.func.isRequired,
    deref: PropTypes.func.isRequired,
  }).isRequired,
  removeSurvey: PropTypes.func.isRequired,
};


class Question extends Component {
  constructor(props) {
    super(props);
    this.state = { newAnswer: '' };
  }

  shouldComponentUpdate(nextProps, nextState){
    return nextProps.question.deref() !== this.props.question.deref() ||
      this.state.newAnswer !== nextState.newAnswer;
  }

  updateAnswer(e) {
    this.setState({newAnswer: e.target.value});
  }

  createAnswer(e) {
    e.preventDefault();

    const { question } = this.props;
    const name = this.state.newAnswer.trim();

    if (name) {
      question.cursor('answers').update((answers) => {
        return answers.push(Immutable.fromJS({name: name }));
      });
      this.setState({newAnswer: ''});
    }
  }

  removeAnswer(i, e) {
    this.props.question.cursor('answers').update((answers) => {
      return answers.delete(i);
    });
  }

  render() {
    const { question, removeQuestion } = this.props;
    const answers = question.cursor('answers').toArray() || [];
    return (
      <div className='question'>
        <h4>Question: {question.cursor('name').deref()}</h4>
        <p>
          <button type='button' className='pure-button button-error button-xsmall' onClick={removeQuestion}>
            <i className='fa fa-minus-circle'></i> Remove Question
          </button>
        </p>
        <form onSubmit={this.createAnswer.bind(this)} className='pure-form'>
          <button type='submit' className='pure-button'>
            <i className='fa fa-plus-circle'></i> Add Answer
          </button>
          {' '}
          <input
            type='text'
            value={this.state.newAnswer}
            onChange={this.updateAnswer.bind(this)}
            placeholder='new answer'
          />
        </form>
        <ul className='answer-list'>
          {answers.map((_, i) => {
            return <li key={i}>
              <button type='button'
                className='pure-button button-xsmall button-error'
                onClick={this.removeAnswer.bind(this, i)}
              >
                <i className='fa fa-minus-circle'></i> Remove
              </button>
              {' '}
              <Answer answer={question.cursor(['answers', i])} />
            </li>;
          })}
        </ul>
      </div>
    );
  }
}

Question.propTypes = {
  question: PropTypes.shape({
    cursor: PropTypes.func.isRequired,
    deref: PropTypes.func.isRequired,
  }).isRequired,
  removeQuestion: PropTypes.func.isRequired,
};

class Answer extends Component {
  shouldComponentUpdate(nextProps, nextState){
    return nextProps.answer.deref() !== this.props.answer.deref();
  }

  render() {
    return (
      <span>
        {this.props.answer.cursor('name').deref()}
      </span>
    );
  }
}

Answer.propTypes = {
  answer: PropTypes.shape({
    cursor: PropTypes.func.isRequired,
    deref: PropTypes.func.isRequired,
  }).isRequired,
};
