const jsdom = require("jsdom");
global.document = jsdom.jsdom("");
global.window = document.defaultView;
global.navigator = window.navigator;

const TagsInput = require("../src");

const React = require("react");
const TestUtils = require("react-addons-test-utils");
const assert = require("assert");

class TestComponent extends React.Component {
  constructor() {
    super()
    this.state = {tags: []}
    this.change = this.change.bind(this);
    this.input = this.input.bind(this);
    this.tagsinput = this.tagsinput.bind(this);
  }

  input() {
    return this.refs.tagsinput.refs.input;
  }

  tagsinput() {
    return this.refs.tagsinput;
  }

  change(tags, changed, changedIndexes) {
    if (this.props.onChange) {
      this.props.onChange.call(this, tags, changed, changedIndexes);
    }
    this.setState({tags});
  }

  len() {
    return this.state.tags.length;
  }

  tag(i) {
    return this.state.tags[i];
  }

  render() {
    let {onChange, ...other} = this.props;
    return <TagsInput ref="tagsinput" value={this.state.tags} onChange={this.change} {...other} />
  }
}

function randstring() {
  return +new Date() + "";
}

function change(comp, value) {
  TestUtils.Simulate.change(comp.input(), {target: {value: value}});
}

function paste(comp, value) {
  TestUtils.Simulate.paste(comp.input(), {
    clipboardData: {
      getData: () => value
    }
  });
}

function keyDown(comp, code) {
  TestUtils.Simulate.keyDown(comp.input(), {keyCode: code});
}

function blur(comp) {
  TestUtils.Simulate.blur(comp.input());
}

function focus(comp) {
  TestUtils.Simulate.focus(comp.input());
}

function click(comp) {
  TestUtils.Simulate.click(comp);
}

function add(comp, tag, keyCode) {
  change(comp, tag);
  keyDown(comp, keyCode || 13);
}

function remove(comp) {
  change(comp, "");
  keyDown(comp, 8);
}

function allTag(comp, tagName) {
  return TestUtils.scryRenderedDOMComponentsWithTag(comp, tagName);
}

function allClass(comp, className) {
  return TestUtils.scryRenderedDOMComponentsWithClass(comp, className);
}

describe("TagsInput", () => {
  describe("basic", () => {
    it("should add a tag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      let tag = randstring();

      change(comp, tag);
      keyDown(comp, 13);
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), tag, "it should be the tag that was added");
    });

    it("should remove a tag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      let tag = randstring();

      add(comp, tag);
      assert.equal(comp.len(), 1, "there should be one tag");
      keyDown(comp, 8);
      assert.equal(comp.len(), 0, "there should be no tags");
    });

    it("should remove a tag by clicking", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      let tag = randstring();

      add(comp, tag + "1");
      add(comp, tag + "2");
      assert.equal(comp.len(), 2, "there should be two tags");

      let removes = allTag(comp, "a");
      assert.equal(removes.length, 2, "there should be two remove buttons");
      click(removes[0]);
      assert.equal(comp.len(), 1, "there should be one tag");
    });

    it("should focus on input when clicking on component div", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      click(comp.tagsinput().refs.div);
    });

    it("should not add empty tag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      change(comp, "");
      keyDown(comp, 13);
      assert.equal(comp.len(), 0, "there should be no tag");
    });

    it("should set a default value for the input", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent currentValue="Default Value" />);
      assert.equal(comp.input()._value, "Default Value", "there should be no tag");
    });
  });

  describe("paste", () => {
    it("should not add a tag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      let tag = randstring();

      paste(comp, tag);
      assert.equal(comp.len(), 0, "there should be one tag");
    });

    it("should add single tag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} />);
      let tag = randstring();

      paste(comp, tag);
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), tag, "it should be the tag that was added");
    });

    it("should add two tags", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} />);
      let firstTag = randstring();
      let secondTag = firstTag + '2';

      paste(comp, firstTag + ' ' + secondTag);
      assert.equal(comp.len(), 2, "there should be two tags");
      assert.equal(comp.tag(0), firstTag, "it should be the first tag that was added");
      assert.equal(comp.tag(1), secondTag, "it should be the second tag that was added");
    });

    it("should support onlyUnique", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} onlyUnique={true} />);
      let tag = randstring();

      paste(comp, tag + ' ' + tag);
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), tag, "it should be the tag that was added");
    });

    it("should support validation", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} validationRegex={/a+/} />);
      let firstTag = 'aaa';
      let secondTag = randstring();

      paste(comp, firstTag + ' ' + secondTag);
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), firstTag, "it should be the tag that was added");
    });

    it("should respect limit", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} maxTags={1} />);
      let firstTag = randstring();
      let secondTag = firstTag + '2';

      paste(comp, firstTag + ' ' + secondTag);
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), firstTag, "it should be the tag that was added");
    });

    it("should split tags on ,", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} pasteSplit={(data) => data.split(",")} />);
      let firstTag = randstring();
      let secondTag = firstTag + '2';

      paste(comp, firstTag + ',' + secondTag);
      assert.equal(comp.len(), 2, "there should be two tags");
      assert.equal(comp.tag(0), firstTag, "it should be the tag that was added");
      assert.equal(comp.tag(1), secondTag, "it should be the tag that was added");
    });
  });

  describe("props", () => {
    let defaultClassName;
    let defaultFocusedClassName;

    beforeEach(() => {
      defaultClassName = "react-tagsinput";
      defaultFocusedClassName = "react-tagsinput--focused";
    });

    it("should not add a tag twice if onlyUnique is true", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent onlyUnique={true} />);
      let tag = randstring();

      change(comp, tag);
      keyDown(comp, 13);
      change(comp, tag);
      keyDown(comp, 13);
      assert.equal(comp.len(), 1, "there should be one tag");
    });

    it("should add a tag twice if onlyUnique is false", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent onlyUnique={false} />);
      let tag = randstring();

      change(comp, tag);
      keyDown(comp, 13);
      change(comp, tag);
      keyDown(comp, 13);
      assert.equal(comp.len(), 2, "there should be two tags");
    });

    it("should add a tag on key code 44", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addKeys={[44]} />);
      let tag = randstring();

      change(comp, tag);
      keyDown(comp, 44);
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), tag, "it should be the tag that was added");
    });

    it("should add a tag on blur, if `this.props.addOnBlur` is true", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnBlur={true} />);
      let tag = randstring();

      change(comp, tag);
      blur(comp);

      assert.equal(comp.len(), 1, "there should be one tag");
      assert.equal(comp.tag(0), tag, "it should be the tag that was added");
    });

    it("should not add a tag on blur, if `this.props.addOnBlur` is false", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent addOnBlur={false} />);
      let tag = randstring();

      change(comp, tag);
      blur(comp);

      assert.equal(comp.len(), 0, "there should be no tag");
    });

    it("should not add a tag on blur, if `this.props.addOnBlur` is not defined", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      let tag = randstring();

      change(comp, tag);
      blur(comp);

      assert.equal(comp.len(), 0, "there should be no tag");
    });

    it("should remove a tag on key code 44", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent removeKeys={[44]} />);
      let tag = randstring();

      add(comp, tag);
      assert.equal(comp.len(), 1, "there should be one tag");
      keyDown(comp, 44);
      assert.equal(comp.len(), 0, "there should be no tags");
    });

    it("should be unlimited tags", () => {
        let comp = TestUtils.renderIntoDocument(<TestComponent maxTags={-1} />);
        let tag = randstring();
        add(comp, tag);
        add(comp, tag);
        assert.equal(comp.len(), 2, "there should be 2 tags");
    });

    it("should limit tags added to 0", () => {
        let comp = TestUtils.renderIntoDocument(<TestComponent maxTags={0} />);
        let tag = randstring();
        add(comp, tag);
        add(comp, tag);
        assert.equal(comp.len(), 0, "there should be 0 tags");
    });

    it("should limit tags added to 1", () => {
        let comp = TestUtils.renderIntoDocument(<TestComponent maxTags={1} />);
        let tag = randstring();
        add(comp, tag);
        add(comp, tag);
        assert.equal(comp.len(), 1, "there should be 1 tags");
    });

    it("should add a default className to host", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);
      assert.equal(allClass(comp, defaultClassName).length, 1);
    });

    it("should add a custom className to host", () => {
      let customClassName = "custom-class";
      let comp = TestUtils.renderIntoDocument(<TestComponent className={customClassName} />);
      assert.equal(allClass(comp, defaultClassName).length, 0);
      assert.equal(allClass(comp, customClassName).length, 1);
    });

    it("should add a default className to host on focus", () => {
      let className = `${defaultClassName} ${defaultFocusedClassName}`;
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      comp.tagsinput().focus();
      assert.equal(allClass(comp, className).length, 1, "on focus");

      comp.tagsinput().blur();
      assert.equal(allClass(comp, className).length, 0, "on blur");
    });

    it("should add a custom className to host on focus", () => {
      let customFocusedClassName = "custom-focus";
      let className = `${defaultClassName} ${customFocusedClassName}`;
      let comp = TestUtils.renderIntoDocument(<TestComponent focusedClassName={customFocusedClassName} />);

      comp.tagsinput().focus();
      assert.equal(allClass(comp, className).length, 1, "on focus");

      comp.tagsinput().blur();
      assert.equal(allClass(comp, className).length, 0, "on blur");
    });

    it("should add props to tag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent tagProps={{className: "test"}} />);
      let tag = randstring();

      add(comp, tag);
      assert.equal(comp.len(), 1, "there should be one tag");
      let tags = allClass(comp, "test");
      assert.equal(comp.len(), tags.length, "there should be one tag");
    });

    it("should add props to input", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent inputProps={{className: "test"}} />);
      let inputs = allTag(comp, "input");

      assert.equal(inputs[0].className, "test", "class name should be test");
    });

    it("should add trigger onFocus and onBlur on input", () => {
      let focused = false;
      let blurred = false;

      function onFocus() {
        focused = true;
      }

      function onBlur() {
        blurred = true;
      }

      let comp = TestUtils.renderIntoDocument(<TestComponent inputProps={{onFocus: onFocus, onBlur: onBlur}}/>);

      focus(comp);
      blur(comp);

      assert.ok(focused, "should have focused");
      assert.ok(blurred, "should have blurred");
    });

    it("should fire onChange on input", (done) => {
      let tag = randstring()
      let onChange = (e) => {
        assert.equal(tag, e.target.value, "input tag should be equal");
        done();
      }

      let comp = TestUtils.renderIntoDocument(<TestComponent inputProps={{onChange: onChange}} />);
      let inputs = allTag(comp, "input");

      change(comp, tag);
    });

    it("should render tags with renderTag", () => {
      let renderTag = (props) => {
        return <div key={props.key} className="test"></div>;
      };

      let comp = TestUtils.renderIntoDocument(<TestComponent renderTag={renderTag} />);
      let tag = randstring();

      add(comp, tag);
      assert.equal(comp.len(), 1, "there should be one tag");
      let tags = allClass(comp, "test");
      assert.equal(comp.len(), tags.length, "there should be one tag");
    });

    it("should use tagDisplayProp to deal with objects", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent tagDisplayProp={'name'} />);

      add(comp, 'foo');
      assert.equal(comp.len(), 1, "there should be one tag");
      assert.deepEqual(comp.tag(0), {name:'foo'}, "should be {name: 'foo'}");
    });

    it("should render input with renderInput", () => {
      let renderInput = (props) => {
        return <input key={props.key} className="test" />;
      };
      let comp = TestUtils.renderIntoDocument(<TestComponent renderInput={renderInput} />);
      let inputs = allTag(comp, "input");

      assert.equal(inputs[0].className, "test", "class name should be test");
    });

    it("should accept tags only matching validationRegex", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent validationRegex={/a+/} />);
      add(comp, 'b');
      assert.equal(comp.len(), 0, "there should be no tags");
      add(comp, 'a');
      assert.equal(comp.len(), 1, "there should be one tag");
    });

    it("should add pass changed value to onChange", () => {
      let onChange = function (tags, changed, changedIndexes) {
        let oldTags = this.state.tags;
        if (oldTags.length < tags.length) {
          let newTags = oldTags.concat(changed)
          assert.deepEqual(newTags, tags, "the old tags plus changed should be the new tags");
          changedIndexes.forEach((i) => {
            assert.equal(newTags[i], changed[i - oldTags.length])
          })
        } else {
          let indexes = [];
          let newTags = oldTags.filter((t, i) => {
            let notRemoved = changed.indexOf(t) === -1;
            if (!notRemoved) {
              indexes.push(i);
            }
            return notRemoved;
          });
          assert.deepEqual(indexes, changedIndexes, "indexes should be the same");
          assert.deepEqual(newTags, tags, "the old tags minus changed should be the new tags");
        }
      }

      let comp = TestUtils.renderIntoDocument(<TestComponent addOnPaste={true} onChange={onChange} />);
      add(comp, 'a');
      add(comp, 'b');
      add(comp, 'c');
      paste(comp, 'd e f');
      remove(comp);
      remove(comp);
      remove(comp);
    });

    it("should disable input when component is disabled", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent disabled={true} />);
      assert.ok(comp.tagsinput().refs.input.disabled, "input should be disabled");
    });
  });

  describe("methods", () => {
    it("should focus input", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      comp.tagsinput().focus();
    });

    it("should blur input", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      comp.tagsinput().blur();
    });

    it("should clear input", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      change(comp, "test");
      comp.tagsinput().clearInput();
      assert.equal(comp.tagsinput().state.tag, '', "there should be no tag value")
    });

    it("should add a tag with addTag", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      comp.tagsinput().addTag("test");
      assert.equal(comp.len(), 1, "there should be one tag")
    });
  });

  describe("coverage", () => {
    it("not remove no existant index", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      comp.tagsinput()._removeTag(1);
    });

    it("should test prevent default", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent onlyUnique={true} value={["test"]} />);

      add(comp, "test", 9);
    });
  });

  describe("bugs", () => {
    it("should not add empty tags", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent />);

      add(comp, '');
      assert.equal(comp.len(), 0, "there should be no tags");
    });

    it("should not override default input props", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent inputProps={{placeholder: "test"}}/>);

      assert.equal(comp.tagsinput().inputProps().className, "react-tagsinput-input", "should have the default className");
    });

    it("should override default input props", () => {
      let comp = TestUtils.renderIntoDocument(<TestComponent inputProps={{className: "test"}}/>);

      assert.equal(comp.tagsinput().inputProps().className, "test", "should not have the default className");
    });
  });
});
